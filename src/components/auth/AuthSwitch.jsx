import React from "react";
import { Link } from "react-router-dom";

const AuthSwitch = ({ isLogin }) => {
  return (
    <div className="">
      <p className="text-gray flex justify-center gap-2 text-body">
        {isLogin ? "Don't have an account?" : "Already have an account?"}

        <Link
          to={isLogin ? "/signup" : "/login"}
          className="text-goldenrod hover:text-dark-goldenrod"
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </div>
  );
};

export default AuthSwitch;
