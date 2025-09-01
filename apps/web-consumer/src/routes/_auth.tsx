import { createFileRoute, Navigate, useLocation, Outlet } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { useEffect, useRef } from 'react'


export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();
  const initialLocation = useRef(location.pathname);

  useEffect(() => {
    initialLocation.current = location.pathname;
  }, [])


  if (isLoading) {
    return <SpinningCirclesLoader />;
  }

  if (!isAuthenticated && location.pathname !== '/sign-in') {
    return <Navigate to="/sign-in" search={{ redirect: initialLocation.current }} replace />;
  }

  return <Outlet />;
}

const SpinningCirclesLoader = () => {
  return (
    <div className="fixed inset-0  flex items-center justify-center">
      <div className="relative">
        {/* Outer circle - slowest */}
        <div className="w-24 h-24 border-2 border-red-500/5 border-t-purple-500 border-r-purple-500 border-b-purple-500 border-l-purple-500/5 rounded-full animate-spin absolute"></div>

        {/* Middle circle - medium speed, reverse direction */}
        <div
          className="w-16 h-16 border-2 border-yellow-500/5 border-t-yellow-500 border-r-yellow-500 border-b-yellow-500 border-l-yellow-500/5 rounded-full animate-spin absolute top-4 left-4"
          style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}
        ></div>

        {/* Inner circle - fastest */}
        <div
          className="w-8 h-8 border-2 border-orange-500/5 border-t-orange-500 border-r-orange-500 border-b-orange-500 border-l-orange-500/5 rounded-full animate-spin absolute top-8 left-8"
          style={{ animationDuration: '0.5s' }}
        ></div>

        {/* Center dot */}
        <div className="w-2 h-2 bg-white rounded-full absolute top-11 left-11 animate-pulse"></div>
      </div>
    </div>
  );
};

