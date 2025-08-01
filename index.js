require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Phonebook = require("./models/phonebook");
const PORT = process.env.PORT;
const app = express();

app.use(express.static("dist"));
app.use(express.json());

const requestLogger = (request, response, next) => {
  console.log("Method:", request.method);
  console.log("Path:  ", request.path);
  console.log("Body:  ", request.body);
  console.log("---");
  next();
};

app.use(requestLogger);

app.get("/", (request, response) => {
  response.send("<p>Server root</p>");
});

app.get("/api/persons", (request, response) => {
  Phonebook.find({}).then((persons) => {
    response.json(persons);
  });
});

app.get("/api/person/:id", (request, response, next) => {
  Phonebook.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.get("/info", (request, response) => {
  const date = new Date();
  Phonebook.find({}).then((persons) => {
    response.send(
      `<p>Phonebook has info for ${persons.length} people.</p><p>${date}</p>`
    );
  });
});

app.post("/api/persons", (request, response, next) => {
  const body = request.body;

  Phonebook.findOne({ name: body.name }).then((existingPerson) => {
    if (existingPerson) {
      return response.status(400).json({ error: "Name must be unique." });
    }

    const person = new Phonebook({
      name: body.name,
      number: body.number,
    });

    person
      .save()
      .then((savedPerson) => {
        response.json(savedPerson);
      })
      .catch((error) => next(error));
  });
});

app.put("/api/persons/:id", (request, response, next) => {
  const { name, number } = request.body;
  Phonebook.findById(request.params.id)
    .then((person) => {
      if (!person) {
        return response.status(404).end();
      }

      person.name = name;
      person.number = number;

      return person.save().then((updatedPerson) => {
        response.json(updatedPerson);
      });
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", (request, response) => {
  Phonebook.findByIdAndDelete(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
