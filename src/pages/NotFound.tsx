import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const NotFound = () => (
  <Layout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="font-display text-8xl font-bold sutra-text mb-2">404</p>
      <h1 className="text-xl text-amber-100 mb-2">Path Not Found</h1>
      <p className="text-orange-100/50 mb-8 max-w-sm">This page isn&apos;t written in the stars. Return home to continue your journey.</p>
      <Link to="/" className="sutra-btn-primary px-6 py-3 rounded-xl font-semibold inline-block">
        Back to Home
      </Link>
    </div>
  </Layout>
);

export default NotFound;
