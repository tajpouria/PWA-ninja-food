const db = firebase.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);

// enable offline data
db.enablePersistence().catch(function(err) {
  if (err.code == "failed-precondition") {
    // probably multiple tabs open at once
    console.log("persistance failed");
  } else if (err.code == "unimplemented") {
    // lack of browser support for the feature
    console.log("persistance not available");
  }
});

db.collection("recipes").onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    // console.log(change, change.doc.data(), change.doc.id);
    if (change.type === "added") {
      renderRecipe(change.doc.data(), change.doc.id);
    }
    if (change.type === "removed") {
      renderRemoveRecipe(change.doc.id);
    }
  });
});

// add new recipe
const form = document.querySelector("form");

form.addEventListener("submit", ev => {
  ev.preventDefault();
  const recipe = {
    title: form.title.value,
    ingredients: form.ingredients.value
  };
  db.collection("recipes")
    .add(recipe)
    .catch(err => console.log(err));

  form.title.value = "";
  form.ingredients.value = "";
});

// deleting ad recipe
const formContainer = document.querySelector(".recipes");

formContainer.addEventListener("click", evt => {
  if (evt.target.tagName === "I") {
    const id = evt.target.getAttribute("data-id");
    db.collection("recipes")
      .doc(id)
      .delete()
      .catch(err => console.log(err));
  }
});
