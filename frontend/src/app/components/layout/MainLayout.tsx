import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { GlobalBackground } from "../GlobalBackground";

export function MainLayout() {
  return (
    <>
      {/* Persistent full-viewport LightPillar background */}
      <GlobalBackground />

      {/* App shell — sits above the background */}
      <div
        className="min-h-screen flex"
        style={{ position: "relative", zIndex: 1 }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-60">
          <TopBar />
          <main className="flex-1 p-6 lg:p-8 pb-24 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
