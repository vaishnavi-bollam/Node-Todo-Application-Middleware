const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
const { format, addDays, differenceInDays, parse } = require("date-fns");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let db = null;

const startDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at port 3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
startDbAndServer();

const middlewareFunc = async (request, response, next) => {
  let validQuery = "";
  const { category, priority, status, date } = request.query;

  let dbResponse = null;
  let isValidQuery = true;
  if (status !== undefined) {
    // console.log(status);
    validQuery = `SELECT * FROM todo WHERE status='${status}';`;
    dbResponse = await db.all(validQuery);
    if (dbResponse.length === 0) {
      isValidQuery = false;
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (priority !== undefined) {
    validQuery = `SELECT * FROM todo WHERE priority='${priority}';`;
    dbResponse = await db.all(validQuery);
    if (dbResponse.length === 0) {
      isValidQuery = false;
      response.status(400);
      response.send("Invalid Todo priority");
      return;
    }
  }
  if (category !== undefined) {
    validQuery = `SELECT * FROM todo WHERE category='${category}';`;
    dbResponse = await db.all(validQuery);
    if (dbResponse.length === 0) {
      isValidQuery = false;
      response.status(400);
      response.send("Invalid Todo category");
      return;
    }
  }

  if (date !== undefined) {
    let parsedDate = "";
    let formattedDate = "";
    try {
      parsedDate = parse(date, "yyyy-M-dd", new Date());
      formattedDate = format(parsedDate, "yyyy-MM-dd");
    } catch (e) {
      isValidQuery = false;
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
    validQuery = `SELECT * FROM todo WHERE due_date='${formattedDate}'`;
    dbResponse = await db.all(validQuery);
    if (dbResponse.length === 0) {
      isValidQuery = false;
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  if (isValidQuery) {
    next();
  }
};

const todoCreate = (request, response, next) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const statusFields = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityFields = ["HIGH", "MEDIUM", "LOW"];
  const categoryFields = ["WORK", "HOME", "LEARNING"];
  let isValidQuery = true;
  if (status !== undefined) {
    if (typeof status !== "string") {
      isValidQuery = false;
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (typeof status === "string") {
      if (!statusFields.includes(status)) {
        isValidQuery = false;
        response.status(400);
        response.send("Invalid Todo Status");
      }
    }
  }

  if (priority !== undefined) {
    if (typeof priority !== "string") {
      isValidQuery = false;
      response.status(400);
      response.send("Invalid Todo priority");
    } else if (typeof priority === "string") {
      if (!priorityFields.includes(priority)) {
        isValidQuery = false;
        response.status(400);
        response.send("Invalid Todo priority");
      }
    }
  }

  if (category !== undefined) {
    if (typeof category !== "string") {
      isValidQuery = false;
      response.status(400);
      response.send("Invalid Todo category");
    } else if (typeof category === "string") {
      if (!categoryFields.includes(category)) {
        isValidQuery = false;
        response.status(400);
        response.send("Invalid Todo category");
      }
    }
  }

  if (isValidQuery) {
    next();
  }
};

// const todoUpdate = async (request, response, next) => {
//   let dbResponse = null;
//   let validQuery = "";
//   const { id, todo, priority, status, category, dueDate } = request.body;
//   const { todoId } = request.params;
//   const statusFields = ["TO DO", "IN PROGRESS", "DONE"];
//   const priorityFields = ["HIGH", "MEDIUM", "LOW"];
//   const categoryFields = ["WORK", "HOME", "LEARNING"];

//   let isValidQuery = true;
//   if (status !== undefined) {
//     if (typeof status !== "string") {
//       isValidQuery = false;
//       response.status(400);
//       response.send("Invalid Todo Status");
//       return;
//     } else if (typeof status === "string") {
//       if (!statusFields.includes(status)) {
//         isValidQuery = false;
//         response.status(400);
//         response.send("Invalid Todo Status");
//         return;
//       } else {
//         console.log(status);
//         validQuery = `SELECT * FROM todo WHERE id=${todoId} AND status='${status}';`;
//         dbResponse = await db.all(validQuery);
//         if (dbResponse.length === 1) {
//           isValidQuery = false;
//           response.status(400);
//           response.send("Invalid Todo Status");
//           return;
//         }
//       }
//     }
//   }
//   if (isValidQuery) {
//     next();
//   }
// };

const todoValidationUpdate = async (requestObject, responseObject, next) => {
  let todoQuery = "";
  let dbResponse = null;
  const todoIdObject = requestObject.params;
  const { todoId } = todoIdObject;
  const requestBody = requestObject.body;
  const { status, priority, todo, category, dueDate } = requestBody;
  const priorityPossible = ["HIGH", "MEDIUM", "LOW"];
  const statusPossible = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryPossible = ["WORK", "HOME", "LEARNING"];
  let isValidQuery = true;
  if (status !== undefined) {
    if (typeof status !== "string") {
      isValidQuery = false;
      responseObject.status(400);
      responseObject.send("Invalid Todo Status");
      return;
    } else if (typeof status === "string") {
      if (!statusPossible.includes(status)) {
        isValidQuery = false;
        responseObject.status(400);
        responseObject.send("Invalid Todo Status");
        return;
      } else {
        todoQuery = `SELECT * FROM todo WHERE id=${todoId} AND status='${status}';`;
        dbResponse = await db.all(todoQuery);
        // console.log(dbResponse); //should get []
        // console.log(dbResponse.length); //should get 0
        if (dbResponse.length === 1) {
          isValidQuery = false;
          responseObject.status(400);
          responseObject.send("Invalid Todo Status");
          return;
        }
      }
    }
  }
  if (priority !== undefined) {
    if (typeof priority !== "string") {
      isValidQuery = false;
      responseObject.status(400);
      responseObject.send("Invalid Todo Priority");
      return;
    } else if (typeof priority === "string") {
      if (!priorityPossible.includes(priority)) {
        isValidQuery = false;
        responseObject.status(400);
        responseObject.send("Invalid Todo Priority");
        return;
      } else {
        todoQuery = `SELECT * FROM todo WHERE id=${todoId} AND priority='${priority}';`;
        dbResponse = await db.all(todoQuery);
        // console.log(dbResponse); //should get []
        // console.log(dbResponse.length); //should get 0
        if (dbResponse.length === 1) {
          isValidQuery = false;
          responseObject.status(400);
          responseObject.send("Invalid Todo Priority");
          return;
        }
      }
    }
  }
  if (category !== undefined) {
    if (typeof category !== "string") {
      isValidQuery = false;
      responseObject.status(400);
      responseObject.send("Invalid Todo Category");
      return;
    } else if (typeof category === "string") {
      if (!categoryPossible.includes(category)) {
        isValidQuery = false;
        responseObject.status(400);
        responseObject.send("Invalid Todo Category");
        return;
      } else {
        todoQuery = `SELECT * FROM todo WHERE id=${todoId} AND category='${category}';`;
        dbResponse = await db.all(todoQuery);
        // console.log(dbResponse); //should get []
        // console.log(dbResponse.length); //should get 0
        if (dbResponse.length === 1) {
          isValidQuery = false;
          responseObject.status(400);
          responseObject.send("Invalid Todo Category");
          return;
        }
      }
    }
  }
  if (todo !== undefined) {
    if (typeof todo !== "string") {
      isValidQuery = false;
      responseObject.status(400);
      responseObject.send("Invalid todo");
      return;
    } else if (typeof todo === "string") {
      todoQuery = `SELECT * FROM todo WHERE id=${todoId} AND todo='${todo}';`;
      dbResponse = await db.all(todoQuery);
      //   console.log(dbResponse); //should get []
      //   console.log(dbResponse.length); //should get 0
      if (dbResponse.length === 1) {
        isValidQuery = false;
        responseObject.status(400);
        responseObject.send("Invalid todo");
        return;
      }
    }
  }

  if (dueDate !== undefined) {
    let parsedDate;
    let formattedDate;
    try {
      parsedDate = parse(dueDate, "yyyy-MM-dd", new Date());
      formattedDate = format(parsedDate, "yyyy-MM-dd");
    } catch (error) {
      isValidQuery = false;
      responseObject.status(400);
      responseObject.send("Invalid Due Date");
      return;
    }
  }

  if (isValidQuery) {
    // console.log("put request next handler");
    next();
  }
};

const scene1 = (requestQuery) => {
  //console.log(scene1);
  return (
    requestQuery.status !== undefined &&
    requestQuery.priority === undefined &&
    requestQuery.category === undefined
  );
};

const scene2 = (requestQuery) => {
  return (
    requestQuery.status === undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.category === undefined
  );
};

const scene3 = (requestQuery) => {
  return (
    requestQuery.status !== undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.category === undefined
  );
};

const scene4 = (requestQuery) => {
  return (
    requestQuery.search_q !== undefined &&
    requestQuery.status === undefined &&
    requestQuery.priority === undefined &&
    requestQuery.category === undefined
  );
};

const scene5 = (requestQuery) => {
  return (
    requestQuery.status !== undefined &&
    requestQuery.priority === undefined &&
    requestQuery.category !== undefined
  );
};

const scene6 = (requestQuery) => {
  return (
    requestQuery.status === undefined &&
    requestQuery.priority === undefined &&
    requestQuery.category !== undefined
  );
};

const scene7 = (requestQuery) => {
  return (
    requestQuery.status === undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.category !== undefined
  );
};

app.get("/todos/", middlewareFunc, async (request, response) => {
  let todoQuery = "";
  const requestQuery = request.query;
  const { search_q = "", status, category, priority } = request.query;
  //   console.log(status);
  switch (true) {
    case scene1(requestQuery):
      //   console.log("vaishu");
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}'`;
      break;
    case scene2(requestQuery):
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}'`;
      break;
    case scene3(requestQuery):
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}' AND status='${status}'`;
      break;
    case scene4(requestQuery):
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
    case scene5(requestQuery):
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND status='${status}';`;
      break;
    case scene6(requestQuery):
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}';`;
      break;
    case scene7(requestQuery):
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND priority='${priority}';`;
      break;
  }
  const dbResponse = await db.all(todoQuery);
  const dbResponseResultArray = dbResponse.map((eachObject) => {
    return {
      id: eachObject.id,
      todo: eachObject.todo,
      priority: eachObject.priority,
      status: eachObject.status,
      category: eachObject.category,
      dueDate: eachObject.due_date,
    };
  });
  response.send(dbResponseResultArray);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const dbResponse = await db.get(todoQuery);
  //console.log(dbResponse);
  const { id, todo, priority, status, category, due_date } = dbResponse;
  const dbResponseResult = {
    id: id,
    todo: todo,
    priority: priority,
    status: status,
    category: category,
    dueDate: due_date,
  };

  response.send(dbResponseResult);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //   console.log(date);
  const parsedDate = parse(date, "yyyy-M-dd", new Date());
  const formattedDate = format(parsedDate, "yyyy-MM-dd");
  const todoQuery = `SELECT * FROM todo WHERE due_date='${formattedDate}';`;
  const dbResponse = await db.all(todoQuery);
  const { id, todo, priority, status, category, due_date } = dbResponse;
  const dbResponseResult = dbResponse.map((eachObject) => {
    return {
      id: eachObject.id,
      todo: eachObject.todo,
      priority: eachObject.priority,
      status: eachObject.status,
      category: eachObject.category,
      dueDate: eachObject.due_date,
    };
  });
  response.send(dbResponseResult);
});

app.post("/todos/", todoCreate, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const parsedDate = parse(dueDate, "yyyy-M-dd", new Date());
  const formattedDate = format(parsedDate, "yyyy-MM-dd");
  const todoQuery = `INSERT INTO todo(id, todo, category,priority,status,due_date )
  VALUES(${id},'${todo}','${category}','${priority}','${status}','${formattedDate}');
  `;
  await db.run(todoQuery);
  response.send("Todo Successfully Added");
});

// const statusScenario1 = (requestBody) => {
//   return requestBody.hasOwnProperty("status");
// };

// app.put("/todos/:todoId/", todoUpdate, async (request, response) => {
//   let dbResponse = null;
//   const requestBody = request.body;
//   const { status, priority, todo, category, dueDate } = request.body;
//   const { todoId } = request.params;
//   let sendText = "";
//   let validQuery = "";
//   switch (true) {
//     case statusScenario1(requestBody):
//       sendingText = "Status Updated";
//       todoQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
//       break;
//   }
//   dbResponse = await db.run(todoQuery);
//   response.send(sendingText);
// });

//API 5 scenarios:
const statusScenario1 = (requestBody) => {
  return requestBody.hasOwnProperty("status");
};
const priorityScenario2 = (requestBody) => {
  return requestBody.hasOwnProperty("priority");
};
const priorityScenario3 = (requestBody) => {
  return requestBody.hasOwnProperty("todo");
};
const priorityScenario4 = (requestBody) => {
  return requestBody.hasOwnProperty("category");
};
app.put(
  "/todos/:todoId/",
  todoValidationUpdate,
  async (requestObject, responseObject) => {
    let dbResponse = null;
    let sendingText = "";
    let todoQuery = "";
    const todoIdObject = requestObject.params;
    const { todoId } = todoIdObject;
    const requestBody = requestObject.body;
    const { status, priority, todo, category, dueDate } = requestBody;
    switch (true) {
      case statusScenario1(requestBody):
        // console.log("1st query");
        sendingText = "Status Updated";
        todoQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
        break;
      case priorityScenario2(requestBody):
        // console.log("2nd query");
        sendingText = "Priority Updated";
        todoQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
        break;
      case priorityScenario3(requestBody):
        // console.log("3rd query");
        sendingText = "Todo Updated";
        todoQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
        break;
      case priorityScenario4(requestBody):
        // console.log("4th query");
        sendingText = "Category Updated";
        todoQuery = `UPDATE todo SET category='${category}' WHERE id=${todoId};`;
        break;

      default:
        // console.log("5th query");
        sendingText = "Due Date Updated";
        todoQuery = `UPDATE todo SET due_date='${dueDate}' WHERE id=${todoId};`;
        break;
    }
    dbResponse = await db.run(todoQuery);
    responseObject.send(sendingText);
  }
);

//API 6:
app.delete(
  "/todos/:todoId/",
  middlewareFunc,
  async (requestObject, responseObject) => {
    const todoIdObject = requestObject.params;
    const { todoId } = todoIdObject;
    const todoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
    await db.run(todoQuery);
    responseObject.send("Todo Deleted");
  }
);

module.exports = app;
