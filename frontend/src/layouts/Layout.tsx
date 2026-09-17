import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header />
      <div className="flex-1 max-w-7xl w-full mx-auto flex px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
