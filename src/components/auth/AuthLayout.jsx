import React from "react";

const AuthLayout = ({ children, content }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-slate-gray py-12 px-10 sm:px-6 lg:px-8">
      <div className="max-w-md w-full grid ">
        <div className="">
          <h2 className="text-goldenrod text-heading-2">{content.title}</h2>
          {content.paragraph && (
            <p className="text-gray text-heading-4"> {content.paragraph}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
