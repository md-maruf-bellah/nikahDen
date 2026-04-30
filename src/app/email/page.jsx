import React from "react";

const Email = () => {
  return (
    <div className="max-w-5xl m-auto">
      <div className="hero bg-base-100 min-h-screen">
        <div className="hero-content flex-col lg:flex-row">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold">Email now!</h1>
            <p className="py-6">
              Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
              excepturi exercitationem quasi. In deleniti eaque aut repudiandae
              et a id nisi.
            </p>
          </div>
          <div className=" bg-base-100 w-full max-w-sm shrink-0 ">
            <div className="">
              <fieldset className="fieldset">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input w-full"
                  placeholder="email"
                />

                <button className="btn bg-[#FD6969] mt-4 ">Email</button>
                <div className="divider">OR</div>

                <div>
                  <a className="link link-hover">Forgot password?</a>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Email;
