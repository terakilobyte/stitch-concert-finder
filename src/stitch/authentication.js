/* eslint-disable no-console */
import { useState, useEffect } from "react";
import {
  UserPasswordCredential,
  FacebookRedirectCredential,
  GoogleRedirectCredential,
  UserPasswordAuthProviderClient,
} from "mongodb-stitch-browser-sdk";
import app from "./app";
import { getUserProfile } from "./mongodb";

/* ## Authentication Functions
 *
 * The functions in this section are wrappers that call authentication methods from the
 * Stitch JavaScript SDK. We'll call these methods in the demo react app whenever an
 * "action" button is clicked.
 */
export function loginEmailPasswordUser({ email, password }) {
  // Log in a user with the specified email and password
  // Note: The user must already be registered with the Stitch app.
  // See https://docs.mongodb.com/stitch/authentication/userpass/#create-a-new-user-account
  return app.auth.loginWithCredential(new UserPasswordCredential(email, password))
}

export function loginFacebookUser() {
  return app.auth.loginWithRedirect(new FacebookRedirectCredential())
}

export function loginGoogleUser() {
  return app.auth.loginWithRedirect(new GoogleRedirectCredential())
}

export function handleOAuthRedirects() {
  if (app.auth.hasRedirectResult()) {
    app.auth.handleRedirectResult()
  }
}

export function hasLoggedInUser() {
  return app.auth.isLoggedIn;
}

export function getAllUsers() {
  // Return a list of all users that are associated with the app
  return app.auth.listUsers();
}

// export function removeUserFromApp(stitchUser) {
//   // Remove a user from the app (and log them out automatically, if necessary)
//   return app.auth.removeUserWithId(stitchUser.id);
// }

// export function switchToUser(stitchUser) {
//   // Set another logged-in user as the active user
//   return app.auth.switchToUserWithId(stitchUser.id);
// }

export function logoutUser(stitchUser) {
  // Log a user out of the app. Logged out users are still associated with
  // the app and will appear in the result of app.auth.listUsers()
  return app.auth.logoutUserWithId(stitchUser.id);
}

// export function isActiveUser(stitchUser) {
//   // Return true if the specified user is logged in and currently active
//   return app.auth.currentUser && app.auth.currentUser.id === stitchUser.id;
// }

export function useStitchAuth() {
  // We'll store the list of users in state
  const [users, setUsers] = useState([]);
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  async function updateCurrentUserProfile(userProfile) {
    if (userProfile) {
      setCurrentUserProfile(userProfile)
    } else {
      const profile = app.auth.user ? await getUserProfile(app.auth.user.id) : null
      setCurrentUserProfile(profile)
    }
  }
  useEffect(() => {
    updateCurrentUserProfile()
  }, [app.auth.user])
  // Whenever some authentication event happens, we want to update our list of users in state.
  // We'll use a Stitch auth listener to call our update function whenever any type of auth event
  // is emitted. We only want to add this listener once (when the component first loads) so we pass
  // an empty dependency array.
  const updateUsers = () => {
    // We'll get a current list of users and update our state with a function
    const appUsers = getAllUsers();
    setUsers(appUsers);
    updateCurrentUserProfile()
  };
  useEffect(() => {
    const listener = {
      onUserAdded: updateUsers,
      onUserLoggedIn: updateUsers,
      onActiveUserChanged: updateUsers,
      onUserLoggedOut: updateUsers,
      onUserRemoved: updateUsers,
      onUserLinked: updateUsers,
      onListenerRegistered: updateUsers,
    };
    app.auth.addAuthListener(listener);
    // React hooks can return a "cleanup" function that ties up any loose ends before
    // a component is unmounted. In this case, we want to remove the auth listener
    // we created to prevent a memory leak.
    return () => app.auth.removeAuthListener(listener);
  }, []);

  // We also want a state variable that indicates if ANY user is currently logged in
  const [hasLoggedInUser, setHasLoggedInUser] = useState(app.auth.isLoggedIn);
  const checkForLoggedInUser = () => {
    setHasLoggedInUser(app.auth.isLoggedIn);
  };
  useEffect(checkForLoggedInUser);

  return { users, hasLoggedInUser, currentUserProfile, updateCurrentUserProfile };
}

function parseToken() {
  // Parse the URL query parameters
  const url = window.location.search;
  const params = new URLSearchParams(url);
  const token = params.get('token');
  const tokenId = params.get('tokenId');
  console.log("t", token, tokenId, window.location);
  return { token, tokenId }
}

export function registerNewEmailUser(email, password) {
  // Register a new email/password user and send them a confirmation email
  const emailProvider = app.auth.getProviderClient(UserPasswordAuthProviderClient.factory)
  return emailProvider
    .registerWithEmail(email, password)
    .catch(e => {
      if (
        e.name === "StitchServiceError" &&
        e.message === "name already in use"
      ) {
        console.log("StitchServiceError ~owo~ name already in use", e);
        return emailProvider.resendConfirmationEmail(email);
      } else {
        console.error("Error sending password reset email:", e);
      }
    });
}

export function confirmEmail() {
  // Confirm the user's email/password account
  const { token, tokenId } = parseToken()
  return app.auth
    .getProviderClient(UserPasswordAuthProviderClient.factory)
    .confirmUser(token, tokenId)
    .then(() => console.log('confirmed!'))
    .catch(() => console.log('not so confirmed!'))
}

export function sendPasswordResetEmail(emailAddress) {
  // Send a password reset email to the specified address
  return app.auth
    .getProviderClient(UserPasswordAuthProviderClient.factory)
    .sendResetPasswordEmail(emailAddress)
    .catch(e => console.error("Error sending password reset email:", e));
}

export function handlePasswordReset(newPassword) {
  // Reset a user's password after they click the email link
  const { token, tokenId } = parseToken()
  return app.auth
    .getProviderClient(UserPasswordAuthProviderClient.factory)
    .resetPassword(token, tokenId, newPassword)
    .catch(err => { console.error("Error resetting password:", err) })
}
