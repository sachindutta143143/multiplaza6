import { findBills } from "./src/lib/data";

async function run() {
  try {
    const res = await findBills({ search: "sharma" });
    console.log("SUCCESS! Found bills with search 'sharma':", res.length);
    if (res.length) {
      console.log("Matched bill customer:", res[0].customerName);
    }
  } catch (e: any) {
    console.error("SEARCH ERROR:", e?.message);
  }
}

run();
