//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/mapMyWorkDB",{useNewUrlParser: true});

const itemsSchema ={
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to Your Mapper! Hit + to add"
});



const defaultItems = [item1];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

Item.find({}, function(err, foundItems){

if(foundItems.length === 0){
  Item.insertMany(defaultItems, function(err){
    if(err){
      console.log(err);
    }
    else{
      console.log("Successfully saved deafult items to Database");
    }
  });
  res.redirect("/");
}
else{
  res.render("list", {
    listTitle: "Today",
    newListItems: foundItems
  });
}
});
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

List.findOne({name: customListName}, function(err, foundList){
  if(!err){
    if(!foundList){
      //Creating a new list
      const list = new List({
        name: customListName,
        items:defaultItems
      });

      list.save();
      res.redirect("/"+ customListName);
    }
    else{
      //show an existing list
      res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
    }
  }
})



});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
const item = new Item({
  name: itemName
});
// if list name is today so simply save and redirect to home page
if(listName === "Today"){
  item.save();
  res.redirect("/");
}
// else if there is some other list then find that list name
//in the DB and then push the data into that list and then redirect to the same route
else{
  List.findOne({name: listName}, function(err, foundList){
     foundList.items.push(item);
     foundList.save();
     res.redirect("/"+ listName);
  });
 }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
// if delete request is coming from the root route
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        res.redirect("/");
      }
    });
  }
  //if the delete request is coming from a custom route
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if(!err){
      res.redirect("/"+ listName);
    }
  });

  }


});
app.get("/work", function(req, res) {
  res.render("list", {listTitle: "Work List",newListItems: workItems});
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
