/**
 * Item tree list navigation module
 * @class CTreeList
 * @extends CScrollList
 * @constructor
 * @author Kopanev Igor
 */

function CTreeList ( parent, options ){

	this.openedClass = "opened";
	this.branchClass = "branch";
	this.arrowClassName = "arrow";
	this.placeholderClassName = "placeholder";

	if (options !== undefined){
		CTreeList.parameters.forEach(function(name){
			if (options[name] !== undefined)
				self[name] = options[name];
		});
	}

	this.tree || (this.tree = []);
	CScrollList.call(this, parent);
	this.baseClass += " ctreelist-main";
}

// extends
CTreeList.prototype = Object.create(CScrollList.prototype);
CTreeList.prototype.constructor = CTreeList;

CTreeList.parameters = ["openedClass", "folderClass", "arrowClassName", "placeholderClassName", "contentField", "titleField", "data"];

CTreeList.prototype.SetTree = function ( tree , refresh ){
	this.tree = tree;
	if (refresh === true)
		this.Refresh();
};

CTreeList.prototype.Refresh = function (){
	var el, i;
	this.Clear();
	for( i = 0; i < this.tree.length; i++ ){
		el = this.tree[i];
		el.item = this.Add({data: el, level: 0});
		if (Array.isArray(el[this.contentField])){
			this.RenderLevel(el[this.contentField], el.item, 1);
		}
	}
};

CTreeList.prototype.RenderLevel = function ( data, parent, level ){
	var el, i, attrs = {};
	for ( i = 0; i < data.length; i++ ){
		el = data[i];
		el.parent = parent;
		if (parent.hidden === true || parent.data.opened === false){
			attrs.hidden = true;
		}
		el.item = this.Add({data: el, level: level, attrs: attrs});
		if (Array.isArray(el[this.contentField])){
			this.RenderLevel(el[this.contentField], el.item, level + 1);
		}
	}
};

CTreeList.prototype.Add = function ( options ) {
	var item, items = [], i,
		attrs = options.attrs || {};
	if (options.level !== undefined){
		for( i = 0; i < options.level; i++ ){
			items.push(element('div', {className: this.placeholderClassName}));
		}
	}
	attrs.data = options.data || {};
	attrs.data.level = options.level;
	items.push(options.data[this.titleField]);
	item = CScrollList.prototype.Add.call(this, items, attrs);
	if (Array.isArray(options.data[this.contentField])){
		item.classList.add(this.branchClass);
		if (options.data.opened === true){
			item.classList.add(this.openedClass);
		}
	}
	return item;
};

CTreeList.prototype.OpenBranch = function ( item, open, forced, subBranch ){
	var self = this;
	if (open === true){
		item.classList.add(this.openedClass);
	}else{
		item.classList.remove(this.openedClass);
	}
	if (Array.isArray(item.data[this.contentField])){
		item.data[this.contentField].forEach(function( element ){
			if (element.item.visible !== false){
				if (Array.isArray(element[self.contentField])){
					if ((element.opened === true && open) || !open || forced)
						self.OpenBranch(element.item, open, forced, true);
				}
				self.Hidden(element.item, !open);
			}
		});
		if (forced || subBranch !== true) {
			item.data.opened = open;
		}
	}
};

CTreeList.prototype.OpenAll = function ( open ){
	for ( var i = 0, item; i < this.tree.length, item = this.tree[i]; i++ ){
		if (item.type === MEDIA_TYPE_HELP_FOLDER){
			this.OpenBranch(item.item, open, true);
		}
	}
};

CTreeList.prototype.Filter = function ( text ){
	var count, word,
		self = this,
		words = text.split(' '),
		leafs = [];
	this.Each(function(item){
		count = 0;
		if (item.data[this.contentField] === undefined){
			for (var i = 0; i < words.length, word = words[i]; i++){
				if (item.data.sentence.toLowerCase().indexOf(word) !== -1){
					count++;
				}
			}
			if (count === words.length){
				leafs.push(item);
			}
		}
		item.visible = false;
		self.Hidden(item, true);
	});
	leafs.forEach(function(leaf){
		self.ShowLeaf(leaf, true);
	});
	this.Focused(this.FirstMatch(this.filterText), true);
};

CTreeList.prototype.ShowAll = function(){
	var self = this;
	this.Each(function(item){
		self.Hidden(item, false);
		item.visible = true;
	});
	this.Focused(this.FindOne(), true);
};

CTreeList.prototype.ShowLeaf = function( leaf, show ){
	var parent = leaf, self = this;
	if (leaf.data.type === MEDIA_TYPE_HELP_ARTICLE){
		while (parent = parent.data.parent){
			self.Hidden(parent, show !== true);
			parent.visible = show;
		}
	}
	leaf.visible = show;
	self.Hidden(leaf, show !== true);
};
