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

const Admin = Loader(lazy(() => import('../src/admin')));

const routes: RouteObject[] = [
  {
    path: '',
    element: <SidebarLayout />,
    children: [
      {
        path: '',
        children: [
          {
            path: '',
            element: <Admin />,
          },
        ],
      },
    ],
  },
];

export default routes;
