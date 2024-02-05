import axios from "axios";

export async function setupAdminSchema(pb: any) {
  console.log("Setting up admin schema");
  const backendSchema = {
    id: "go82o0vyl8xkowv",
    name: "instances",
    type: "base",
    system: false,
    schema: [
      {
        system: false,
        id: "jhewjqmy",
        name: "title",
        type: "text",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        system: false,
        id: "chuyxeah",
        name: "active",
        type: "bool",
        required: false,
        presentable: false,
        unique: false,
        options: {}
      },
      {
        system: false,
        id: "rjxkr15i",
        name: "running",
        type: "bool",
        required: false,
        presentable: false,
        unique: false,
        options: {}
      },
      {
        system: false,
        id: "a66fqlpf",
        name: "storage",
        type: "number",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          noDecimal: false
        }
      },
      {
        system: false,
        id: "wadg3kj3",
        name: "activePID",
        type: "number",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          noDecimal: false
        }
      },
      {
        system: false,
        id: "eg140qfa",
        name: "activePORT",
        type: "number",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          noDecimal: false
        }
      }
    ],
    indexes: [],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {}
  };

  const collections = await pb.collections.getFullList({ sort: "-created" });

  const backendSchemaExists =
    collections.filter((c: any) => c.name === "instances")[0] || null;
  if (backendSchemaExists === null) {
    console.log("Creating schema: instances");
    await pb.collections.create(backendSchema);
  }
}

export async function setupRootAdmin(): Promise<void> {
  console.log("Setting up root admin");

  return new Promise(async (resolve) => {
    const url = `http://127.0.0.1:8000/api/admins`;
    const payload = {
      email: process.env.ADMIN_USER,
      password: process.env.ADMIN_PW,
      passwordConfirm: process.env.ADMIN_PW
    };
    try {
      await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log("Admin created");
    } catch (error) {
      console.log("Error when creating root admin");
    }
    resolve();
  });
}
