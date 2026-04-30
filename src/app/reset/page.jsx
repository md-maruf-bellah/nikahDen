import React from "react";

const Login = () => {
  return (
    <div className="max-w-5xl m-auto">
      <div className="hero bg-base-100 min-h-screen">
        <div className="hero-content flex-col lg:flex-row">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold">Login now!</h1>
            <p className="py-6">
              Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
              excepturi exercitationem quasi. In deleniti eaque aut repudiandae
              et a id nisi.
            </p>
          </div>
          <div className=" bg-base-100 w-full max-w-sm shrink-0 ">
            <div className="">
              <fieldset className="fieldset">
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input w-full"
                  placeholder="password"
                />

                <label className="label">Password</label>
                <input
                  type="password"
                  className="input w-full"
                  placeholder="password"
                />

                <div>
                  <a className="link link-hover">Forgot password?</a>
                </div>

                <button className="btn bg-[#FD6969] mt-4 ">Login</button>
                <div className="divider">OR</div>

                <div className="flex gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="checkbox checkbox-xs"
                  />
                  <span>
                    আমি আপনাদের সকল ট্রামস্ এন্ড কন্ডিশন এর সাথে সহমত পোষন
                    করতেছি।
                  </span>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
