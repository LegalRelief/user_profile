document.addEventListener("DOMContentLoaded", event => {
    const app = firebase.app();
    
    const db = firebase.firestore();
    userCollection = db.collection("Users");
    caseCollection = db.collection("Cases");
});

//login function for someone with existing account
function login() {
    //authenticate to app with google account
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(result => {
        user = result.user;
        const userDoc = userCollection.doc(user.uid);
        userDoc.get().then(doc => {
            if(doc.id == user.uid){
                //confirming that user already has data stored
                document.body.innerHTML = "\
                <button onclick=\"updateUser()\">Update User Info</button><br>\
                <button onclick=\"createCase()\">Create Case</button><br>\
                <button onclick=\"viewCases()\">View my Cases</button><br>\
                <button onclick=\"logout()\">Log Out</button>";//home_screen
            }
        }).catch(error => {
            //user document does not exist yet, so cannot log in
            console.error("Error authenticating with app: ", error);
            //undo google auth
            firebase.auth().signOut().then(() => {
                console.log("Logged out");
            }).catch(error => {
                console.error("Error signing out: ", error);
            });
            user = null;
            location.reload();
        });
    }).catch(error => {
        //google auth failed
        console.error("Error authenticating with google: ", error);
    });
}

//function to create a new account
function createAccount() {
    //authenticate to app with google account
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(result => {
        user = result.user;
        document.body.innerHTML = "Verify and set information<br>\
        Name:" + user.displayName + "<br>\
        Email:" + user.email + "<br>\
        Username:\
        <input type=\"text\" id=\"usernameInput\"><br>\
        <button onclick=\"cancelCreateAccount()\">Cancel</button>\
        <button onclick=\"confirmCreateAccount()\">Confirm</button>";//verify page
    }).catch(error => {
        //google auth failed
        console.error("Error authenticating: ", error);
    });
}

//cancel account creation
function cancelCreateAccount() {
    //possibly remove auth?
    firebase.auth().signOut().then(() => {
        console.log("Logged out");
    }).catch(error => {
        console.error("Error signing out: ", error);
    });
    user = null;
    document.body.innerHTML = "<button onclick=\"login()\">\
    Log In\
    </button><br>\
    <button onclick=\"createAccount()\">\
    Create Account\
    </button>";//index.html
    location.reload();
}

//confirm creation of account
function confirmCreateAccount() {
    if(user == null){
        console.error("Error: not authenticated with app");
        return;
    }
    //get User doc to determine if user already has account
    const userDoc = userCollection.doc(user.uid);
    userDoc.get().then(doc => {
        console.error("Error: user already exists");
        //sign out of google
        firebase.auth().signOut().then(() => {
            console.log("Logged out");
        }).catch(error => {
            console.error("Error signing out: ", error);
        });
        user = null;
        document.body.innerHTML = "<button onclick=\"login()\">\
        Log In\
        </button><br>\
        <button onclick=\"createAccount()\">\
        Create Account\
        </button>"//index.html
        location.reload();
    }).catch(() => {
        userDoc.set({
            name: user.displayName,
            email: user.email,
            username: document.getElementById("usernameInput").value
        }).catch(error => {
            console.error("Error writing document: ", error);
            return;
        });
        document.body.innerHTML = "\
        <button onclick=\"updateUser()\">Update User Info</button><br>\
        <button onclick=\"createCase()\">Create Case</button><br>\
        <button onclick=\"viewCases()\">View my Cases</button><br>\
        <button onclick=\"logout()\">Log Out</button>";//home_screen.html
    });
}

//logout of function
function logout() {
    if(user == null){
        console.error("Error: not logged in");
        return;
    }
    firebase.auth().signOut().then(() => {
        console.log("Logged out");
    }).catch(error => {
        console.error("Error signing out: ", error);
    });
    user = null;
    document.body.innerHTML = "<button onclick=\"login()\">\
    Log In\
    </button><br>\
    <button onclick=\"createAccount()\">\
    Create Account\
    </button>";//index.html
    location.reload();
}

//update user information
function updateUser() {
    const userDoc = userCollection.doc(user.uid);
    userDoc.get().then(doc => {
        document.body.innerHTML = "Update information<br>\
        Name:" + user.displayName + "<br>\
        Email:" + user.email + "<br>\
        Username:\
        <input type=\"text\" placeholder=\"" + doc.data().username + "\" id=\"usernameInput\"><br>\
        <button onclick=\"cancelFunction()\">Cancel</button>\
        <button onclick=\"confirmUpdateUser()\">Confirm</button>";//update user page
    }).catch(error => {
        console.error("Error reading document: ", error);
    });
}

//confirm user information update
function confirmUpdateUser() {
    const userDoc = userCollection.doc(user.uid);
    userDoc.set({
        username: document.getElementById("usernameInput").value
    }, {merge: true}).catch(error => {
        console.error("Error updating user information: ", error);
    });
    document.body.innerHTML = "\
    <button onclick=\"updateUser()\">Update User Info</button><br>\
    <button onclick=\"createCase()\">Create Case</button><br>\
    <button onclick=\"viewCases()\">View my Cases</button><br>\
    <button onclick=\"logout()\">Log Out</button>";//home screen
}

//cancel user information update
function cancelFunction() {
    document.body.innerHTML = "\
    <button onclick=\"updateUser()\">Update User Info</button><br>\
    <button onclick=\"createCase()\">Create Case</button><br>\
    <button onclick=\"viewCases()\">View my Cases</button><br>\
    <button onclick=\"logout()\">Log Out</button>";//home screen
}

//create new case screen
function createCase() {
    document.body.innerHTML = "Create new case<br>\
    description: <input type=\"text\" id=\"caseDescription\"><br>\
    status: active<br>\
    funding acquired: $0<br>\
    <button onclick=\"cancelFunction()\">Cancel</button>\
    <button onclick=\"confirmCreateCase()\">Confirm</button>";
}

//confirm creation of new case
function confirmCreateCase() {
    caseCollection.add({
        userID: user.uid,
        description: document.getElementById("caseDescription").value,
        status: "active",
        funding_acquired: 0
    }).then(() => {
        console.log("Successfully created case document");
    }).catch(error => {
        console.error("Error adding case document: ", error);
    });
    document.body.innerHTML = "\
    <button onclick=\"updateUser()\">Update User Info</button><br>\
    <button onclick=\"createCase()\">Create Case</button><br>\
    <button onclick=\"viewCases()\">View my Cases</button><br>\
    <button onclick=\"logout()\">Log Out</button>";//home screen
}

//View of all the users cases
function viewCases() {
    var htmlString = "<button onclick=\"cancelFunction()\">Return</button><br>";
    const caseQuery = caseCollection.where("userID", "==", user.uid);
    caseQuery.get().then(queryResult => {
        if(queryResult.empty){
            console.log("The user has no cases to be displayed");
            return;
        }
        queryResult.forEach(caseDoc => {
            data = caseDoc.data();
            htmlString = htmlString + "<div>\
            status: " + data.status + ", funding acquired: $" + data.funding_acquired +
            "<br>description: " + data.description +
            "<br><button onclick=\"updateCase(\'" + caseDoc.id + "\')\">Update Case</button>\
            <button onclick=\"deleteCase(\'" + caseDoc.id +
            "\')\">Delete Case</button></div><br><br>";
            document.body.innerHTML = htmlString;//case view screen
        });
    }).catch(error => {
        console.error("Error reading case documents: ", error);
    });
}

//screen for updating case information
function updateCase(caseID) {
    const caseDoc = caseCollection.doc(caseID);
    caseDoc.get().then(doc => {
        data = doc.data();
        document.body.innerHTML = "Update case information<br>\
        description: <input type=\"text\" id=\"caseDescription\" placeholder=\"" +
        data.description + "\"><br>Status (active, or closed): " +
        "<input type=\"text\" id=\"caseStatus\" placeholder=\"" + data.status +
        "\"><br><button onclick=\"viewCases()\">Cancel</button><button onclick=\
        \"confirmUpdateCase(\'" + caseID + "\')\">Confirm</button>";//case update screen
    }).catch(error => {
        console.error("Error retrieving case document: ", error);
    });
}

//confirm updating case information
function confirmUpdateCase(caseID) {
    const caseDoc = caseCollection.doc(caseID);
    caseDoc.set({
        description: document.getElementById("caseDescription").value,
        status: document.getElementById("caseStatus").value
    }, {merge: true}).then(() => {
        console.log("Successfully updated case document");
    }).catch(error => {
        console.error("Error updating case document: ", error);
    });
    document.body.innerHTML = "<button onclick=\"updateUser()\">Update User Info</button><br>\
    <button onclick=\"createCase()\">Create Case</button><br>\
    <button onclick=\"viewCases()\">View my Cases</button><br>\
    <button onclick=\"logout()\">Log Out</button>";
}

//delete case document
function deleteCase(caseID) {
    const caseDoc = caseCollection.doc(caseID);
    caseDoc.delete().then(() => {
        console.log("Successfully deleted case");
    }).catch(error => {
        console.error("Error deleting case document: ", error);
    });
    document.body.innerHTML = "<button onclick=\"updateUser()\">Update User Info</button><br>\
    <button onclick=\"createCase()\">Create Case</button><br>\
    <button onclick=\"viewCases()\">View my Cases</button><br>\
    <button onclick=\"logout()\">Log Out</button>";
}