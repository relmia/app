import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router';

import SidebarLayout from '../src/layouts/SidebarLayout';
import { Navigate } from 'react-router-dom';

import SuspenseLoader from '../src/components/SuspenseLoader';

const Loader = (Component) => (props) =>
  (
    <Suspense fallback={<SuspenseLoader />}>
      <Component {...props} />
    </Suspense>
  );

// Applications

const UserSettings = Loader(lazy(() => import('../src/content/applications/Users/settings')));

const routes: RouteObject[] = [
  {
    path: '',
    element: <Navigate to="management/profile/settings" replace />,
  },
  {
    path: 'management',
    element: <SidebarLayout />,
    children: [
      {
        path: 'profile',
        children: [
          {
            path: 'settings',
            element: <UserSettings />,
          },
        ],
      },
    ],
  },
];

export default routes;
