// ১. ব্যক্তিগত তথ্য
export const PersonalInfo = ({ register, errors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Clothing Style */}
    <div className="form-control w-full">
      <label className="text-md">
        ঘরের বাহিরে সাধারণত কি ধরণের পোষাক পরেন?
      </label>
      <input
        {...register("clothingStyle")}
        placeholder="পাঞ্জাবি, টি-শার্ট, অফিসিয়াল ড্রেস"
        className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
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
        className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
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
        className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
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
        className={`input input-bordered input-lg text-sm w-full focus:outline-none  ${
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
        className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
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
        className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
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
    <div className="form-control w-full  md:col-span-2">
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
    <div className="form-control w-full  md:col-span-2">
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

export const ReligiousInfo = ({ register, errors }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Religion */}
      <div className="form-control w-full">
        <label className="label">ধর্ম</label>
        <select
          {...register("religion")}
          className={`select select-bordered select-lg w-full text-sm focus:outline-none ${
            errors.religion ? "border-red-500" : ""
          }`}
        >
          <option value="">ধর্ম নির্বাচন করুন</option>
          <option value="Islam">ইসলাম</option>
          <option value="Hinduism">হিন্দুধর্ম</option>
          <option value="Christianity">খ্রিস্টধর্ম</option>
          <option value="Buddhism">বৌদ্ধধর্ম</option>
          <option value="Other">অন্যান্য</option>
        </select>

        {errors.religion && (
          <p className="text-red-500 text-xs mt-1">{errors.religion.message}</p>
        )}
      </div>

      {/* Denomination */}
      <div className="form-control w-full">
        <label className="label">মাজহাব / সম্প্রদায় / Denomination</label>
        <input
          {...register("sectOrDenomination")}
          placeholder="উদাহরণ: সুন্নি, শিয়া, ক্যাথলিক"
          className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
            errors.sectOrDenomination ? "border-red-500" : ""
          }`}
        />

        {errors.sectOrDenomination && (
          <p className="text-red-500 text-xs mt-1">
            {errors.sectOrDenomination.message}
          </p>
        )}
      </div>

      {/* Practice Level */}
      <div className="form-control w-full">
        <label className="label">ধর্মীয় চর্চার স্তর</label>

        <select
          {...register("religiousPracticeLevel")}
          className={`select select-bordered select-lg text-sm w-full focus:outline-none ${
            errors.religiousPracticeLevel ? "border-red-500" : ""
          }`}
        >
          <option value="">নির্বাচন করুন</option>
          <option value="Very Practicing">খুবই নিয়মিত</option>
          <option value="Practicing">নিয়মিত</option>
          <option value="Moderate">মাঝারি</option>
          <option value="Occasional">মাঝেমধ্যে</option>
        </select>

        {errors.religiousPracticeLevel && (
          <p className="text-red-500 text-xs mt-1">
            {errors.religiousPracticeLevel.message}
          </p>
        )}
      </div>

      {/* Place of Worship */}
      <div className="form-control w-full">
        <label className="label">উপাসনালয়ে কতটা নিয়মিত যান?</label>

        <input
          {...register("placeOfWorshipAttendance")}
          placeholder="বিস্তারিত লিখুন"
          className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
            errors.placeOfWorshipAttendance ? "border-red-500" : ""
          }`}
        />

        {errors.placeOfWorshipAttendance && (
          <p className="text-red-500 text-xs mt-1">
            {errors.placeOfWorshipAttendance.message}
          </p>
        )}
      </div>

      {/* Holy Book Reading */}
      <div className="form-control w-full">
        <label className="label">ধর্মগ্রন্থ পাঠ করেন?</label>

        <input
          {...register("holyBookReading")}
          placeholder="হ্যাঁ / না / মাঝে মাঝে"
          className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
            errors.holyBookReading ? "border-red-500" : ""
          }`}
        />

        {errors.holyBookReading && (
          <p className="text-red-500 text-xs mt-1">
            {errors.holyBookReading.message}
          </p>
        )}
      </div>

      {/* Religious Education */}
      <div className="form-control w-full">
        <label className="label">ধর্মীয় শিক্ষা</label>

        <input
          {...register("religiousEducation")}
          placeholder="ধর্মীয় শিক্ষার বিবরণ"
          className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
            errors.religiousEducation ? "border-red-500" : ""
          }`}
        />

        {errors.religiousEducation && (
          <p className="text-red-500 text-xs mt-1">
            {errors.religiousEducation.message}
          </p>
        )}
      </div>

      {/* Religious Dress */}
      <div className="form-control w-full">
        <label className="label">ধর্মীয় পোশাক বা বিধান অনুসরণ করেন?</label>

        <input
          {...register("religiousDressPreference")}
          placeholder="বিস্তারিত লিখুন"
          className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
            errors.religiousDressPreference ? "border-red-500" : ""
          }`}
        />

        {errors.religiousDressPreference && (
          <p className="text-red-500 text-xs mt-1">
            {errors.religiousDressPreference.message}
          </p>
        )}
      </div>

      {/* Charity */}
      <div className="form-control w-full">
        <label className="label">
          দান বা সামাজিক সেবামূলক কাজে অংশগ্রহণ করেন?
        </label>

        <input
          {...register("charityActivity")}
          placeholder="হ্যাঁ / না"
          className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
            errors.charityActivity ? "border-red-500" : ""
          }`}
        />

        {errors.charityActivity && (
          <p className="text-red-500 text-xs mt-1">
            {errors.charityActivity.message}
          </p>
        )}
      </div>

      {/* Organization */}
      <div className="form-control w-full">
        <label className="label">কোনো ধর্মীয় সংগঠনের সাথে যুক্ত?</label>

        <input
          {...register("religiousOrganization")}
          placeholder="বিস্তারিত লিখুন"
          className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
            errors.religiousOrganization ? "border-red-500" : ""
          }`}
        />

        {errors.religiousOrganization && (
          <p className="text-red-500 text-xs mt-1">
            {errors.religiousOrganization.message}
          </p>
        )}
      </div>

      {/* Dietary Practice */}
      <div className="form-control w-full">
        <label className="label">ধর্মীয় খাদ্যনীতি অনুসরণ করেন?</label>

        <input
          {...register("dietaryPractice")}
          placeholder="বিস্তারিত লিখুন"
          className={`input input-bordered input-lg text-sm w-full focus:outline-none ${
            errors.dietaryPractice ? "border-red-500" : ""
          }`}
        />

        {errors.dietaryPractice && (
          <p className="text-red-500 text-xs mt-1">
            {errors.dietaryPractice.message}
          </p>
        )}
      </div>

      {/* Future Goal */}
      <div className="form-control w-full md:col-span-2">
        <label className="label">ধর্মীয় বিষয়ে ভবিষ্যৎ পরিকল্পনা</label>

        <textarea
          {...register("futureReligiousGoal")}
          className={`textarea textarea-bordered w-full focus:outline-none ${
            errors.futureReligiousGoal ? "border-red-500" : ""
          }`}
        />

        {errors.futureReligiousGoal && (
          <p className="text-red-500 text-xs mt-1">
            {errors.futureReligiousGoal.message}
          </p>
        )}
      </div>

      {/* Partner Expectation */}
      <div className="form-control w-full md:col-span-2">
        <label className="label">জীবনসঙ্গীর ধর্মীয় বিষয়ে প্রত্যাশা</label>

        <textarea
          {...register("partnerReligiousExpectation")}
          className={`textarea textarea-bordered w-full focus:outline-none ${
            errors.partnerReligiousExpectation ? "border-red-500" : ""
          }`}
        />

        {errors.partnerReligiousExpectation && (
          <p className="text-red-500 text-xs mt-1">
            {errors.partnerReligiousExpectation.message}
          </p>
        )}
      </div>
    </div>
  );
};

// ৩. শিক্ষাগত যোগ্যতা
export const EducationalInfo = ({ register, errors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="form-control w-full">
      <label className="label">আপনার শিক্ষা মাধ্যম</label>
      <input
        {...register("education")}
        placeholder="আপনার শিক্ষা মাধ্যম"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>

    <div className="form-control w-full">
      <label className="label">সর্বোচ্চ শিক্ষাগত যোগ্যতা</label>
      <input
        {...register("education")}
        placeholder="সর্বোচ্চ শিক্ষাগত যোগ্যতা"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>

    <div className="form-control w-full">
      <label className="label">এস.এস.সি / দাখিল / সমমান পাসের সন</label>
      <input
        {...register("education")}
        placeholder="এস.এস.সি / দাখিল / সমমান পাসের সন"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>

    <div className="form-control w-full">
      <label className="label">বিভাগ</label>
      <input
        {...register("education")}
        placeholder="বিভাগ"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>

    <div className="form-control w-full">
      <label className="label">ফলাফল</label>
      <input
        {...register("education")}
        placeholder="ফলাফল"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>

    <div className="form-control w-full">
      <label className="label">SSC পরে কোন মাধ্যমে পড়াশুনা করেছেন?</label>
      <input
        {...register("education")}
        placeholder="SSC পরে কোন মাধ্যমে পড়াশুনা করেছেন?"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>
    <div className="form-control w-full">
      <label className="label">এইচ.এস.সি / আলিম / সমমান পাসের সন</label>
      <input
        {...register("education")}
        placeholder="এইচ.এস.সি / আলিম / সমমান পাসের সন"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>

    <div className="form-control w-full">
      <label className="label">বিভাগ</label>
      <input
        {...register("education")}
        placeholder="বিভাগ"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>

    <div className="form-control w-full">
      <label className="label">ফলাফল</label>
      <input
        {...register("education")}
        placeholder="ফলাফল"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>
    <div className="form-control w-full">
      <label className="label">
        স্নাতক / স্নাতক (সম্মান) / ফাজিল অধ্যয়নের বিষয়
      </label>
      <input
        {...register("education")}
        placeholder="স্নাতক / স্নাতক (সম্মান) / ফাজিল অধ্যয়নের বিষয়"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      <label>আপনি যে ডিপার্টমেন্টে পড়ছেন/পড়েছেন সেটি লিখুন।</label>

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>
    <div className="form-control w-full">
      <label className="label">আপনার শিক্ষা মাধ্যম</label>
      <input
        {...register("education")}
        placeholder="আপনার শিক্ষা মাধ্যম"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>
    <div className="form-control w-full">
      <label className="label">শিক্ষাপ্রতিষ্ঠানের নাম</label>
      <input
        {...register("education")}
        placeholder="শিক্ষাপ্রতিষ্ঠানের নাম"
        className={`input input-lg input-bordered text-sm w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>
    <div className="form-control w-full">
      <label className="label">কোন বর্ষে পড়ছেন?</label>
      <textarea
        {...register("education")}
        placeholder="কোন বর্ষে পড়ছেন?"
        className={`textarea input-bordered w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      <label>
        শিক্ষাপ্রতিষ্ঠানের নাম, বিষয়, পাসের সন সহ বিস্তারিত লিখবেন। কিছু না
        থাকলে ঘরটি ফাঁকা রাখবেন।
      </label>
      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>
    <div className="form-control w-full">
      <label className="label">দ্বীনি শিক্ষাগত পদবী সমূহ</label>
      <textarea
        {...register("education")}
        placeholder="দ্বীনি শিক্ষাগত পদবী সমূহ

"
        className={`textarea input-bordered w-full focus:outline-none ${
          errors.education ? "border-red-500" : ""
        }`}
      />

      <label>
        আপনার কোনো পদবী না থাকলে ঘরটি ফাঁকা রাখুন। থাকলে এক বা একাধিক নির্বাচন
        করতে পারবেন।{" "}
      </label>

      {errors.education && (
        <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>
      )}
    </div>
  </div>
);

// ৪. পেশাগত তথ্য
export const ProfessionalInfo = ({ register, errors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="form-control w-full">
      <label className="label">পেশা</label>
      <input
        {...register("occupation")}
        placeholder="পেশা"
        className={`input input-lg input-bordered  w-full text-sm focus:outline-none ${
          errors.occupation ? "border-red-500" : ""
        }`}
      />

      {errors.occupation && (
        <p className="text-red-500 text-xs mt-1">{errors.occupation.message}</p>
      )}
    </div>
    <div className="form-control w-full">
      <label className="label">মাসিক আয়</label>
      <input
        {...register("occupation")}
        placeholder="মাসিক আয়
"
        className={`input input-lg input-bordered w-full text-sm focus:outline-none ${
          errors.occupation ? "border-red-500" : ""
        }`}
      />

      {errors.occupation && (
        <p className="text-red-500 text-xs mt-1">{errors.occupation.message}</p>
      )}
    </div>{" "}
    <div className="form-control w-full md:col-span-2">
      <label className="label">পেশার বিস্তারিত বিবরণ</label>
      <textarea
        {...register("occupation")}
        placeholder="পেশার বিস্তারিত বিবরণ"
        className={`textarea input-lg input-bordered w-full text-sm focus:outline-none ${
          errors.occupation ? "border-red-500" : ""
        }`}
      />

      <label>
        আপনার কর্মস্থল কোথায়, আপনি কোন প্রতিষ্ঠানে কাজ করছেন, আপনার উপার্জন
        হালাল কি না ইত্যাদি লিখতে পারেন।
      </label>

      {errors.occupation && (
        <p className="text-red-500 text-xs mt-1">{errors.occupation.message}</p>
      )}
    </div>{" "}
  </div>
);

// ৫. পারিবারিক তথ্য
export const FamilyInfo = ({ register, errors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input
      {...register("fatherName")}
      placeholder="পিতার নাম"
      className="input input-bordered input-lg text-sm w-full"
    />
    <input
      {...register("motherName")}
      placeholder="মাতার নাম"
      className="input input-bordered input-lg text-sm w-full"
    />
    <input
      {...register("siblings")}
      placeholder="ভাই-বোনের সংখ্যা"
      className="input input-bordered input-lg text-sm w-full"
    />
  </div>
);

// ৬. যোগাযোগ ও ঠিকানা
export const ContactInfo = ({ register, errors }) => (
  <div className="space-y-4">
    <input
      {...register("mobile")}
      placeholder="মোবাইল নম্বর"
      className="input input-bordered input-lg text-sm w-full"
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
      className="input input-bordered input-lg text-sm w-full"
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
