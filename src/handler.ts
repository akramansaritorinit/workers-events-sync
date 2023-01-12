import { Router } from "itty-router";
import { v4 as uuidv4 } from "uuid";

type RetryConfigType = {
   NumberOfRetries: number;
   RetryInterval: number;
   Timeout: number;
};

export const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Methods": "GET, PUT, POST,DELETE",
   "Access-Control-Max-Age": "86400",
   "Content-Type": "application/json",
};

const router = Router();
const configs = {
   customerId: "e4fecf1f-4372-443e-b5d3-a7f69b769fd3",
   endpoints: [
      {
         url: "https://lingering-haze-67b1.star-lord.workers.dev/api/users",
         credentials: {
            username: "test",
            password: "test",
         },
      },
      {
         url: "https://data.sync-machine.workers.dev/api/users",
         credentials: {
            username: "test",
            password: "test",
         },
      },
   ],
};

router.get("/users", async (request, env) => {
   const fetchObject = {
      method: "GET",
      headers: {
         "Content-Type": "application/json",
      },
   };

   let responseData: any[] = [];
   const key = uuidv4();
   const responseArray: any[] = await Promise.all(
      configs.endpoints.map(async (endpoint, i) => {
         let status;
         const response = await fetch(endpoint.url, fetchObject).then(
            (response) => {
               status = response.status;
               return response.json();
            }
         );
         const data = await response;
         responseData.push({
            id: i,
            key,
            request: {
               url: endpoint.url,
               ...fetchObject,
            },
            response: {
               status,
               response: data,
            },
         });

         return {
            endpoint: endpoint.url,
            response: data,
         };
      })
   );
   await env.EventsList.put(key, JSON.stringify({ key, events: responseData }));
   return Response.json(responseArray, {
      headers: { ...corsHeaders },
   });
});

router.get("/events", async (request, env) => {
   const keys: any[] = (await env.EventsList.list()).keys;
   const values: any[] = await Promise.all(
      keys.map(async (key) => await env.EventsList.get(key.name))
   );

   const data = values.map((value) => JSON.parse(value));

   return Response.json(data, {
      headers: { ...corsHeaders },
   });
});

router.get("/events/:key/:eventId", async (request, env) => {
   const { key, eventId } = request.params;
   const data = JSON.parse(await env.EventsList.get(key));
   const responseData = data.events.filter((req: any) => req.id == eventId);
   return Response.json(data ? responseData : {}, {
      headers: { ...corsHeaders },
   });
});

router.post("/users", async (request, env) => {
   const body = await request.json();
   const fetchObject = {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
   };

   let responseData: any[] = [];
   const key = uuidv4();
   const responseArray: any[] = await Promise.all(
      configs.endpoints.map(async (endpoint, i) => {
         let status;
         const response = await fetch(endpoint.url, fetchObject).then(
            (response) => {
               status = response.status;
               return response.json();
            }
         );
         const data = await response;
         responseData.push({
            id: i,
            key,
            request: {
               url: endpoint.url,
               ...fetchObject,
               body: JSON.parse(fetchObject.body),
            },
            response: {
               status,
               response: data,
            },
         });
         return {
            endpoint: endpoint.url,
            response: data,
         };
      })
   );
   await env.EventsList.put(key, JSON.stringify({ key, events: responseData }));
   return Response.json(responseArray, {
      headers: { ...corsHeaders },
   });
});

router.post("/headers", async (request, env) => {
   const body = await request.json();
   await env.EventsList.put("headers", JSON.stringify(body));
   const headers: {} = JSON.parse(await env.EventsList.get("headers"));
   return Response.json(
      { meassge: "Headers added", success: true, headers },
      { headers: { ...corsHeaders } }
   );
});

router.get("/headers", async (request, env) => {
   const headers: {} = JSON.parse(await env.EventsList.get("headers"));
   return Response.json({ headers }, { headers: { ...corsHeaders } });
});

router.post("/retryconfig", async (request, env) => {
   const body: RetryConfigType = await request.json();
   if (!body.NumberOfRetries || !body.RetryInterval || !body.Timeout) {
      return Response.json(
         { error: true, message: "Invalid retry config" },
         { headers: { ...corsHeaders } }
      );
   }
   await env.EventsList.put("retryconfig", JSON.stringify(body));
   const retryconfig: RetryConfigType = JSON.parse(
      await env.EventsList.get("retryconfig")
   );
   return Response.json(
      { meassge: "Retry config added", success: true, retryconfig },
      { headers: { ...corsHeaders } }
   );
});

router.get("/retryconfig", async (request, env) => {
   const retryconfig: RetryConfigType = JSON.parse(
      await env.EventsList.get("retryconfig")
   );
   return Response.json({ retryconfig }, { headers: { ...corsHeaders } });
});

router.all(
   "*",
   () =>
      new Response("Not Found.", {
         status: 404,
         headers: { ...corsHeaders },
      })
);

export default router;
