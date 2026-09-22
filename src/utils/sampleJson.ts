export const SAMPLE_JSON = JSON.stringify(
  {
    meta: {
      total: 214,
      cursor: "eyJpZCI6ODg3MX0",
    },
    members: [
      {
        id: "usr_8f21",
        name: "Dana Whitfield",
        role: "admin",
        seats: 3,
        verified: true,
        last_active: "2026-09-19T11:04:22Z",
        teams: [
          { id: "tm_01", name: "Platform" },
          { id: "tm_04", name: "Design" },
        ],
        invited_by: null,
      },
      {
        id: "usr_31ac",
        name: "Julian Frost",
        role: "member",
        seats: 1,
        verified: false,
        last_active: null,
        teams: [],
        invited_by: "usr_8f21",
      },
    ],
  },
  null,
  2,
);
