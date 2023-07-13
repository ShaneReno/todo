//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://shanereynolds:XEt8JsvErTU9896N@cluster0.ygnrwjr.mongodb.net/todolistDB?retryWrites=true&w=majority", { useNewUrlParser: true });


const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Make breakfast"
});

const item2 = new Item({
  name: "Clean yard"
});

const item3 = new Item({
  name: "Study Udemy"
});

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema)




app.get("/", function (req, res) {
  Item.find({}).then(function (foundItems) {
    console.log(foundItems);


    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
        .then(function () {
          console.log("Successfully saved defult items to DB");

        })
        .catch(function (err) {
          console.log(err);
        });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    };
  })
    .catch(function (err) {
      console.log(err);
    });

});


app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save()
          .then(function () {
            console.log("saved");
            res.redirect("/" + customListName); // Redirect after saving the new list
          });
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});


app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }


});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        console.log("Successfully deleted checked item");
      })
      .catch(function (err) {
        console.log(err);
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(function () {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }


});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
