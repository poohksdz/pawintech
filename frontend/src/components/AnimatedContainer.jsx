import React from "react";
import { Container } from "react-bootstrap";
import TrackVisibility from "react-on-screen";

const AnimatedContainer = ({ id, children, className = "" }) => {
    return (
      <TrackVisibility once>
        {({ isVisible }) => (
          <Container
            id={id}
            style={isVisible ? { animationDuration: "5s" } : {}}
            className={`${className} ${
                isVisible ? "animate__animated animate__fadeIn custom-fadeIn" : ""
              }`}
              
          >
            {children}
          </Container>
        )}
      </TrackVisibility>
    );
  };

  export default AnimatedContainer; 
