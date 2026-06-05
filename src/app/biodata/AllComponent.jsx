// ১. ব্যক্তিগত তথ্য
export const PersonalInfo = ({ register, errors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Clothing Style */}
    <div className="form-control w-full">
      <label>ঘরের বাহিরে সাধারণত কি ধরণের পোষাক পরেন?</label>
      <input
        {...register("clothingStyle")}
        placeholder="পাঞ্জাবি, টি-শার্ট, অফিসিয়াল ড্রেস"
        className={`input input-bordered w-full focus:outline-none ${
          errors.clothingStyle ? "border-red-500" : ""
        }`}
      />
      {errors.clothingStyle && (
        <span className="text-red-500 text-xs mt-1">
          {errors.clothingStyle.message}
        </span>
      )}
    </div>

    {/* Health Condition */}
    <div className="form-control w-full">
      <label>আপনার মানসিক বা শারীরিক কোনো রোগ আছে?</label>
      <input
        {...register("healthCondition")}
        type="text"
        placeholder="রোগের নাম এবং বর্তমান অবস্থা"
        className={`input input-bordered w-full focus:outline-none ${
          errors.healthCondition ? "border-red-500" : ""
        }`}
      />
      {errors.healthCondition && (
        <span className="text-red-500 text-xs mt-1">
          {errors.healthCondition.message}
        </span>
      )}
    </div>

    {/* Entertainment Habit */}
    <div className="form-control w-full">
      <label>নাটক / সিনেমা / সিরিয়াল / গান এসব দেখেন বা শুনেন?</label>
      <input
        {...register("entertainmentHabit")}
        placeholder="হ্যাঁ/না এবং কী ধরনের পছন্দ করেন"
        className={`input input-bordered w-full focus:outline-none ${
          errors.entertainmentHabit ? "border-red-500" : ""
        }`}
      />
      {errors.entertainmentHabit && (
        <span className="text-red-500 text-xs mt-1">
          {errors.entertainmentHabit.message}
        </span>
      )}
    </div>

    {/* Political View */}
    <div className="form-control w-full">
      <label>আপনার রাজনৈতিক দর্শন</label>
      <input
        {...register("politicalView")}
        type="text"
        placeholder="রাজনৈতিক দর্শন"
        className={`input input-bordered w-full focus:outline-none  ${
          errors.politicalView ? "border-red-500" : ""
        }`}
      />
      {errors.politicalView && (
        <span className="text-red-500 text-xs mt-1">
          {errors.politicalView.message}
        </span>
      )}
    </div>

    {/* Favorite Books & Personalities */}
    <div className="form-control w-full">
      <label>পছন্দের কিছু বই এবং পছন্দের ব্যক্তিত্বের নাম লিখুন</label>
      <input
        {...register("favoriteBooksPeople")}
        type="text"
        placeholder="বই ও ব্যক্তিত্বের নাম"
        className={`input input-bordered w-full focus:outline-none ${
          errors.favoriteBooksPeople ? "border-red-500" : ""
        }`}
      />
      {errors.favoriteBooksPeople && (
        <span className="text-red-500 text-xs mt-1">
          {errors.favoriteBooksPeople.message}
        </span>
      )}
    </div>

    {/* Phone Number */}
    <div className="form-control w-full">
      <label>পাত্রের মোবাইল নাম্বার</label>
      <input
        {...register("phoneNumber")}
        type="text"
        placeholder="01XXXXXXXXX"
        className={`input input-bordered w-full focus:outline-none ${
          errors.phoneNumber ? "border-red-500" : ""
        }`}
      />
      {errors.phoneNumber && (
        <span className="text-red-500 text-xs mt-1">
          {errors.phoneNumber.message}
        </span>
      )}
    </div>

    {/* About Yourself */}
    <div className="form-control w-full">
      <label>নিজের শখ, পছন্দ-অপছন্দ, রুচিবোধ, স্বপ্ন ইত্যাদি বিষয়ে লিখুন</label>
      <textarea
        {...register("aboutYourself")}
        placeholder="নিজের সম্পর্কে লিখুন"
        className={`textarea textarea-bordered w-full focus:outline-none ${
          errors.aboutYourself ? "border-red-500" : ""
        }`}
      />
      {errors.aboutYourself && (
        <span className="text-red-500 text-xs mt-1">
          {errors.aboutYourself.message}
        </span>
      )}
    </div>

    {/* Special Categories */}
    <div className="form-control w-full">
      <label>আপনার ক্ষেত্রে প্রযোজ্য হয় এমন ক্যাটাগরি সিলেক্ট করুন।</label>
      <textarea
        {...register("specialCategories")}
        placeholder="আপনার জন্য প্রযোজ্য ক্যাটাগরি লিখুন"
        className={`textarea textarea-bordered w-full focus:outline-none ${
          errors.specialCategories ? "border-red-500" : ""
        }`}
      />
      {errors.specialCategories && (
        <span className="text-red-500 text-xs mt-1">
          {errors.specialCategories.message}
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
        className={`select select-bordered w-full focus:outline-none ${errors.religion ? "border-red-500" : ""}`}
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
        className={`input input-bordered w-full focus:outline-none ${errors.prayerStatus ? "border-red-500" : ""}`}
      />
      {errors.prayerStatus && (
        <p className="text-red-500 text-xs mt-1">
          {errors.prayerStatus.message}
        </p>
      )}
    </div>
    <div>
      <select
        {...register("religion")}
        className={`select select-bordered w-full focus:outline-none ${errors.religion ? "border-red-500" : ""}`}
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
        className={`input input-bordered w-full focus:outline-none ${errors.prayerStatus ? "border-red-500" : ""}`}
      />
      {errors.prayerStatus && (
        <p className="text-red-500 text-xs mt-1">
          {errors.prayerStatus.message}
        </p>
      )}
    </div>
    <div>
      <select
        {...register("religion")}
        className={`select select-bordered w-full focus:outline-none ${errors.religion ? "border-red-500" : ""}`}
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
        className={`input input-bordered w-full focus:outline-none ${errors.prayerStatus ? "border-red-500" : ""}`}
      />
      {errors.prayerStatus && (
        <p className="text-red-500 text-xs mt-1">
          {errors.prayerStatus.message}
        </p>
      )}
    </div>
    <div>
      <select
        {...register("religion")}
        className={`select select-bordered w-full focus:outline-none ${errors.religion ? "border-red-500" : ""}`}
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
        className={`input input-bordered w-full focus:outline-none ${errors.prayerStatus ? "border-red-500" : ""}`}
      />
      {errors.prayerStatus && (
        <p className="text-red-500 text-xs mt-1">
          {errors.prayerStatus.message}
        </p>
      )}
    </div>
    <div>
      <select
        {...register("religion")}
        className={`select select-bordered w-full focus:outline-none ${errors.religion ? "border-red-500" : ""}`}
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
        className={`input input-bordered w-full focus:outline-none ${errors.prayerStatus ? "border-red-500" : ""}`}
      />
      {errors.prayerStatus && (
        <p className="text-red-500 text-xs mt-1">
          {errors.prayerStatus.message}
        </p>
      )}
    </div>
    <div>
      <select
        {...register("religion")}
        className={`select select-bordered w-full focus:outline-none ${errors.religion ? "border-red-500" : ""}`}
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
        className={`input input-bordered w-full focus:outline-none ${errors.prayerStatus ? "border-red-500" : ""}`}
      />
      {errors.prayerStatus && (
        <p className="text-red-500 text-xs mt-1">
          {errors.prayerStatus.message}
        </p>
      )}
    </div>
    <div>
      <select
        {...register("religion")}
        className={`select select-bordered w-full focus:outline-none ${errors.religion ? "border-red-500" : ""}`}
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
        className={`input input-bordered w-full focus:outline-none ${errors.prayerStatus ? "border-red-500" : ""}`}
      />
      {errors.prayerStatus && (
        <p className="text-red-500 text-xs mt-1">
          {errors.prayerStatus.message}
        </p>
      )}
    </div>
    <div>
      <select
        {...register("religion")}
        className={`select select-bordered w-full focus:outline-none ${errors.religion ? "border-red-500" : ""}`}
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
        className={`input input-bordered w-full focus:outline-none ${errors.prayerStatus ? "border-red-500" : ""}`}
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
