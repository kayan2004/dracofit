import React from "react";
import { Link } from "react-router-dom";

const AuthSwitch = ({ isLogin }) => {
  return (
    <div className="mt-6">
      <p className="text-gray-950 flex justify-center gap-2">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <div>
          <Link
            to={isLogin ? "/signup" : "/login"}
            className="text-goldenrod hover:text-dark-goldenrod"
          >
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </div>
      </p>
    </div>
  );
};

export default AuthSwitch;
