import React from "react";
import Image from "next/image";
import about from "./../../../assets/hero/about.png";

const AboutUs = () => {
  return (
    <div className="\min-h-screen">
      {/* Header Section */}
      <div className="bg-[#ff6b6b] py-16 text-center text-white">
        <h1 className="text-3xl font-bold mb-2">আমাদের সম্পর্কে</h1>
        <p className="text-sm">হোম / আমাদের সম্পর্কে</p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* About Us Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div className="flex justify-center">
            {/* আপনার ইলাস্ট্রেশন ইমেজটি এখানে বসাবেন */}
            <div className="relative w-full max-w-md aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              {/* <span className="text-gray-400">Illustration Image Here</span>
               */}
              <Image
                src={about}
                width={"100%"}
                height={"auto"}
                className="w-full h-auto"
              />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold  mb-6">আমাদের কথা</h2>
            <p className=" leading-relaxed text-justify">
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
            </p>
          </div>
        </div>

        {/* Mission and Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Objective */}
          <div>
            <h3 className="text-2xl font-bold  mb-4 border-b-2 border-red-50 inline-block">
              উদ্দেশ্য
            </h3>
            <p className=" leading-relaxed text-justify mt-4">
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
            </p>
          </div>

          {/* Goal */}
          <div>
            <h3 className="text-2xl font-bold  mb-4 border-b-2 border-red-50 inline-block">
              লক্ষ্য
            </h3>
            <p className=" leading-relaxed text-justify mt-4">
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
