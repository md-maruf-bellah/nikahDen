// সেকশন ১: ব্যক্তিগত তথ্য
export const PersonalInfo = ({ register, errors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div>
      <label className="text-sm font-medium">নামের প্রথম অংশ *</label>
      <input
        {...register("firstName")}
        className="input input-bordered w-full h-10 rounded-sm mt-1"
      />
      <p className="text-red-500 text-xs">{errors.firstName?.message}</p>
    </div>
    <div>
      <label className="text-sm font-medium">নামের শেষ অংশ *</label>
      <input
        {...register("lastName")}
        className="input input-bordered w-full h-10 rounded-sm mt-1"
      />
      <p className="text-red-500 text-xs">{errors.lastName?.message}</p>
    </div>
  </div>
);
