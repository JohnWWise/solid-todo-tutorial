import React, { useEffect, useState } from "react";
import { useSession } from "@inrupt/solid-ui-react";
import {
  createThing,
  addStringNoLocale,
  addDatetime,
  addUrl,
  getSourceUrl,
  setThing,
  saveSolidDatasetAt,
  SolidDataset,
} from "@inrupt/solid-client";
import { getOrCreateTodoList } from "../../utils";
import { schema, cal, rdf } from "rdf-namespaces";

interface AddTodoProps {
  podUrl: string;
}

function AddTodo({ podUrl }: AddTodoProps) {
  const { session } = useSession();
  const [todoList, setTodoList] = useState<SolidDataset | null>(null);
  const [todoText, setTodoText] = useState("");

  // Load or create the todos dataset on mount
  useEffect(() => {
    if (!session.info.isLoggedIn || !podUrl) return;

    const containerUri = `${podUrl}todos/`;

    (async () => {
      const dataset = await getOrCreateTodoList(containerUri, session.fetch);
      setTodoList(dataset);
    })();
  }, [session, podUrl]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoList || !todoText.trim()) return;

    const indexUrl = getSourceUrl(todoList);
    if (!indexUrl) {
      console.error("No source URL found for the to-do dataset.");
      return;
    }

    // Build a new to-do Thing
    const newTodo = addUrl(
      addDatetime(
        addStringNoLocale(createThing(), schema.text, todoText.trim()),
        cal.created,
        new Date()
      ),
      rdf.type,
      cal.Vtodo
    );

    // Save to dataset
    const updatedList = setThing(todoList, newTodo);
    const savedList = await saveSolidDatasetAt(indexUrl, updatedList, {
      fetch: session.fetch,
    });

    setTodoList(savedList);
    setTodoText(""); // Clear input
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label htmlFor="todo-input">
        <input
          id="todo-input"
          type="text"
          value={todoText}
          onChange={(e) => setTodoText(e.target.value)}
          placeholder="Enter a new to-do"
        />
      </label>
      <button type="submit" className="add-button">Add Todo</button>
    </form>
  );
}

export default AddTodo;
