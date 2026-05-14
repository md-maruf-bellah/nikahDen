// সেকশন ২: ধর্মীয় তথ্য (আপনার বর্তমান ফর্ম অনুযায়ী)
export const ReligiousInfo = ({ register, errors }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <label className="text-xs">জন্ম সাল *</label>
        <input
          {...register("birthYear")}
          className="input input-bordered w-full h-10 mt-1"
        />
      </div>
      <div>
        <label className="text-xs">জন্ম মাস *</label>
        <input
          {...register("birthMonth")}
          className="input input-bordered w-full h-10 mt-1"
        />
      </div>
      <div>
        <label className="text-xs">উচ্চতা *</label>
        <input
          {...register("height")}
          className="input input-bordered w-full h-10 mt-1"
        />
      </div>
      <div>
        <label className="text-xs">ওজন *</label>
        <input
          {...register("weight")}
          className="input input-bordered w-full h-10 mt-1"
        />
      </div>
    </div>
    <div>
      <label className="text-sm">ঠিকানা *</label>
      <input
        {...register("address")}
        className="input input-bordered w-full h-10 mt-1"
      />
    </div>
  </div>
);
