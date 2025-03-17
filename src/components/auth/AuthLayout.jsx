import React from "react";

const AuthLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-slate-gray py-12 px-10 sm:px-6 lg:px-8">
      <div className="max-w-md w-full grid  ">
        <div>
          <h2 className="font-display  text-3xl ">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
