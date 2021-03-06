import React from "react";
import styled from "@emotion/styled";
import app, { logoutUser } from "./../stitch";
import { navigate } from "@reach/router";
import { Button } from "reactstrap";

const NavbarContainer = styled.div`
  height: 60px;
  padding: 10px 20px;
  line-height: 40px;
  display: flex;
  flex-direction: row-reverse;
`;

const LogoutButton = () => (
  <Button onClick={() => logoutUser(app.auth.user)}>Log Out</Button>
);

const UserProfileButton = () => (
  <Button onClick={() => navigate("/profile")}>User Profile</Button>
);

const AppButton = () => <Button onClick={() => navigate("/app")}>App</Button>;

function Navbar(props) {
  const { currentView="app" } = props
  const ViewShift = ({
    "app": UserProfileButton,
    "profile": AppButton,
  })[currentView]
  return (
    <NavbarContainer>
      <LogoutButton />
      <ViewShift />
    </NavbarContainer>
  );
}

export default Navbar;
