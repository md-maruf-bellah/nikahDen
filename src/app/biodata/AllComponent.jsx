// ১. ব্যক্তিগত তথ্য
export const PersonalInfo = ({ register, errors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="form-control w-full">
      <input
        {...register("name")}
        placeholder="পুরো নাম"
        className={`input input-bordered w-full ${errors.name ? "border-red-500" : ""}`}
      />
      {errors.name && (
        <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>
      )}
    </div>

    <div className="form-control w-full">
      <input
        {...register("birthDate")}
        type="date"
        className={`input input-bordered w-full ${errors.birthDate ? "border-red-500" : ""}`}
      />
      {errors.birthDate && (
        <span className="text-red-500 text-xs mt-1">
          {errors.birthDate.message}
        </span>
      )}
    </div>

    <div className="form-control w-full">
      <select
        {...register("gender")}
        className={`select select-bordered w-full ${errors.gender ? "border-red-500" : ""}`}
      >
        <option value="">লিঙ্গ নির্বাচন করুন</option>
        <option value="male">পুরুষ</option>
        <option value="female">নারী</option>
      </select>
      {errors.gender && (
        <span className="text-red-500 text-xs mt-1">
          {errors.gender.message}
        </span>
      )}
    </div>
  </div>
);

// ২. ধর্মীয় তথ্য
export const ReligiousInfo = ({ register, errors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <select
        {...register("religion")}
        className={`select select-bordered w-full ${errors.religion ? "border-red-500" : ""}`}
      >
        <option value="">ধর্ম নির্বাচন করুন</option>
        <option value="islam">ইসলাম</option>
        <option value="hindu">হিন্দু</option>
      </select>
      {errors.religion && (
        <p className="text-red-500 text-xs mt-1">{errors.religion.message}</p>
      )}
    </div>

    <div>
      <input
        {...register("prayerStatus")}
        placeholder="নামাজ নিয়মিত পড়েন কি?"
        className={`input input-bordered w-full ${errors.prayerStatus ? "border-red-500" : ""}`}
      />
      {errors.prayerStatus && (
        <p className="text-red-500 text-xs mt-1">
          {errors.prayerStatus.message}
        </p>
      )}
    </div>
  </div>
);

// ৩. শিক্ষাগত যোগ্যতা
export const EducationalInfo = ({ register, errors }) => (
  <div className="space-y-4">
    <input
      {...register("lastDegree")}
      placeholder="সর্বশেষ শিক্ষাগত যোগ্যতা"
      className="input input-bordered w-full"
    />
    <input
      {...register("institution")}
      placeholder="প্রতিষ্ঠানের নাম"
      className="input input-bordered w-full"
    />
  </div>
);

// ৪. পেশাগত তথ্য
export const ProfessionalInfo = ({ register, errors }) => (
  <div className="space-y-4">
    <input
      {...register("occupation")}
      placeholder="আপনার পেশা"
      className="input input-bordered w-full"
    />
    <input
      {...register("monthlyIncome")}
      placeholder="মাসিক আয় (ঐচ্ছিক)"
      className="input input-bordered w-full"
    />
  </div>
);

// ৫. পারিবারিক তথ্য
export const FamilyInfo = ({ register, errors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input
      {...register("fatherName")}
      placeholder="পিতার নাম"
      className="input input-bordered w-full"
    />
    <input
      {...register("motherName")}
      placeholder="মাতার নাম"
      className="input input-bordered w-full"
    />
    <input
      {...register("siblings")}
      placeholder="ভাই-বোনের সংখ্যা"
      className="input input-bordered w-full"
    />
  </div>
);

// ৬. যোগাযোগ ও ঠিকানা
export const ContactInfo = ({ register, errors }) => (
  <div className="space-y-4">
    <input
      {...register("mobile")}
      placeholder="মোবাইল নম্বর"
      className="input input-bordered w-full"
    />
    <textarea
      {...register("presentAddress")}
      placeholder="বর্তমান ঠিকানা"
      className="textarea textarea-bordered w-full"
    />
    <textarea
      {...register("permanentAddress")}
      placeholder="স্থায়ী ঠিকানা"
      className="textarea textarea-bordered w-full"
    />
  </div>
);

// ৭. অঙ্গীকারনামা
export const AgreementInfo = ({ register, errors }) => (
  <div className="bg-red-50 p-4 border border-red-200 rounded">
    <p className="text-sm text-gray-700 mb-4">
      আমি সাক্ষ্য দিচ্ছি যে প্রদত্ত সকল তথ্য সত্য। কোনো ভুল তথ্য দিলে তার জন্য
      কর্তৃপক্ষ দায়ী নয়।
    </p>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        {...register("agreed")}
        className="checkbox checkbox-error"
      />
      <span className="text-sm font-medium">
        আমি উপরের তথ্যের সত্যতা নিশ্চিত করছি
      </span>
    </label>
  </div>
);

export const GeneralInfo = ({ register, errors }) => (
  <div className="space-y-4">
    <input
      {...register("mobile")}
      placeholder="মোবাইল নম্বর"
      className="input input-bordered w-full"
    />
    <textarea
      {...register("presentAddress")}
      placeholder="বর্তমান ঠিকানা"
      className="textarea textarea-bordered w-full"
    />
    <textarea
      {...register("permanentAddress")}
      placeholder="স্থায়ী ঠিকানা"
      className="textarea textarea-bordered w-full"
    />
  </div>
);
