const PORT = process.env.PORT || 3000;
const AUTHORIZED_REDIRECTS = process.env.AUTHORIZED_REDIRECTS?.split(',') || [
  'http://localhost:3000',
];

const server = Bun.serve({
  port: PORT,
  routes: {
    '/forward': {
      POST: async (req) => {
        const params = new URL(req.url).searchParams;
        const dest = params.get('dest');

        if (!dest) {
          return Response.json(
            { error: 'Destination not specified' },
            { status: 400 }
          );
        }

        const redirectUrl = new URL(dest);
        if (!AUTHORIZED_REDIRECTS.includes(redirectUrl.origin)) {
          return Response.json(
            { error: 'Unauthorized redirect' },
            { status: 403 }
          );
        }

        console.log(`Forwarding request to: ${dest}`);
        const headers = new Headers();
        for (const [key, value] of req.headers) {
          if (key.toLowerCase().startsWith('x-')) {
            headers.set(key, value);
          }
        }
        const response = await fetch(dest, {
          method: 'POST',
          headers,
          body: req.body,
        });
        if (!response.ok) {
          return Response.json(
            {
              status: response.status,
              error: 'Failed to forward request',
              data: await response.text(),
            },
            { status: 500 }
          );
        }

        return Response.json({
          success: true,
        });
      },
    },
  },

  fetch(req) {
    return new Response('Not Found', { status: 404 });
  },
});

console.log(
  `Server running at http://localhost:${
    server.port
  }, forwarding requests to authorized destinations only : ${AUTHORIZED_REDIRECTS.join(
    ', '
  )}`
);
