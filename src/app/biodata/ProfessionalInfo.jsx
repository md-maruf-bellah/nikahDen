// সেকশন ৩: পেশাগত তথ্য
export const ProfessionalInfo = ({ register, errors }) => (
  <div>
    <label className="text-sm">বর্তমান পেশা *</label>
    <input
      {...register("profession")}
      className="input input-bordered w-full h-10 mt-1"
    />
    <p className="text-red-500 text-xs">{errors.profession?.message}</p>
  </div>
);
