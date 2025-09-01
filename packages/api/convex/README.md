# Welcome to your Convex functions directory!

Write your Convex functions here.
See https://docs.convex.dev/functions for more.

A query function that takes two arguments looks like:

```ts
// functions.js
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query("tablename").collect();

    // Arguments passed from the client are properties of the args object.
    // (args.first, args.second);

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents;
  },
});
```

Using this query function in a React component looks like:

```ts
const data = useQuery(api.functions.myQueryFunction, {
  first: 10,
  second: "hello",
});
```

A mutation function looks like:

```ts
// functions.js
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert("messages", message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get(id);
  },
});
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.functions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: "Hello!", second: "me" });
  // OR
  // use the result once the mutation has completed
  mutation({ first: "Hello!", second: "me" }).then((result) =>
    // (result),
  );
}
```

Use the Convex CLI to push your functions to a deployment. See everything
the Convex CLI can do by running `npx convex -h` in your project root
directory. To learn more, launch the docs with `npx convex docs`.




# Folder structure
packages/api/convex/
├── businesses/
│   ├── queries.ts       # getBusinessById, getBusinessByEmail, etc.
│   ├── mutations.ts     # createBusiness, updateBusiness, etc.
│   └── validators.ts    # reusable validators for business operations
├── venues/
│   ├── queries.ts
│   ├── mutations.ts
│   └── validators.ts
├── classes/             # Domain grouping for class-related operations
│   ├── types/
│   │   ├── queries.ts   # getClassTypes, getClassTypesByBusiness
│   │   └── mutations.ts # createClassType, updateClassType
│   ├── schedules/
│   │   ├── queries.ts   # getSchedulesByBusiness, getScheduleById
│   │   ├── mutations.ts # createSchedule, updateSchedule
│   │   └── actions.ts   # generateInstances (complex operation)
│   └── instances/
│       ├── queries.ts   # getUpcomingInstances, getInstancesByDate
│       ├── mutations.ts # updateInstance, cancelInstance
│       └── actions.ts   # complex instance operations
├── bookings/
│   ├── queries.ts       # getBookingsByCustomer, getBookingsByInstance
│   ├── mutations.ts     # createBooking, cancelBooking
│   └── actions.ts       # processPayment, handleWaitlist
├── customers/
│   ├── queries.ts
│   ├── mutations.ts
│   └── actions.ts       # creditManagement, membershipOperations
├── shared/
│   ├── validators.ts    # Common validators across domains
│   ├── utils.ts         # Shared utility functions
│   └── types.ts         # Common type definitions
└── _generated/          # Convex generated files