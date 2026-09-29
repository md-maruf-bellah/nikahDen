import React, { Suspense } from "react";
import MessagingPage from "../profile/message/MessagingPage";

const page = () => {
  return (
    <div className="max-w-7xl p-2 lg:p-10 mx-auto">
      {/* MessagingPage এখন useSearchParams ব্যবহার করে (?chat= deep-link) — Suspense বাধ্যতামূলক */}
      <Suspense fallback={null}>
        <MessagingPage />
      </Suspense>
    </div>
  );
};

export default page;
