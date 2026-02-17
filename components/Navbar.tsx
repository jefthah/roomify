import { Box } from "lucide-react";
import React from "react";
import { Button } from "./ui/Button";
import { useOutletContext } from "react-router";

const Navbar = () => {
  const { isSignedIn, username, signIn, signOut } =
    useOutletContext<AuthContext>();

  const handleAuthClick = async () => {
    if (isSignedIn) {
      try {
        await signOut();
      } catch (e) {
        console.error("Error signing out:", e);
      }

      return;
    }
    try {
      await signIn();
    } catch (e) {
      console.error("Puter signing in failed:", e);
    }
  };

  return (
    <header className="navbar">
      <div className="inner">
        <div className="left">
          <div className="brand">
            <Box className="logo" />
            <span className="name">Roomify</span>
          </div>

          <div className="links">
            <a href="#">Products</a>
            <a href="#">Pricing</a>
            <a href="#">Community</a>
            <a href="#">Enterprise</a>
          </div>
        </div>

        <div className="actions">
          {isSignedIn ? (
            <>
              <span className="greeting">
                {username ? `HI, ${username.toUpperCase()}` : "SIGNED IN"}
              </span>
              <Button size="sm" onClick={handleAuthClick} className="btn">
                LOG OUT
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleAuthClick}
                className="login"
              >
                LOG IN
              </Button>
              <a href="#upload" className="cta">
                <Button variant="primary">GET STARTED</Button>
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
