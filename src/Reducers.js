import { List } from 'immutable';
import { Positions } from '../src/Tree';

export function collapseNode(tree, action) {
	const newNode = action.get('collapsed').set(
		'collapsed', !action.getIn([ 'collapsed', 'collapsed' ]));
	return replaceNode(tree, newNode);
}

export function selectNode(tree, action) {
	const newNode = action.get('selected').set(
		'selected', !action.getIn([ 'selected', 'selected' ]));
	return replaceNode(tree, newNode);
}

function replaceNode(nodes, newNode) {
	return nodes.map(function(node) {
		if (node.get('id') === newNode.get('id')) {
			return newNode;
		}
		else if (node.has('children')) {
			return node.set('children', replaceNode(node.get('children'), newNode));
		}
		return node;
	});
}

export function removeAllEffects(nodes) {
	return nodes.map(function(node) {
		const newNode = node.remove('hover');
		if (newNode.has('children')) {
			const children = removeAllEffects(newNode.get('children'));
			return newNode.set('children', children);
		}
		return newNode;
	});
}

export function setHoverEffects(tree, action, canDrop) {
	const treeCopy = removeAllEffects(tree);
	if (!canDrop(action)) {
		return treeCopy;
	}
	let newNode = action.get('target');
	newNode = newNode.
		set('collapsed', false).
		set('hover', action.get('position'));
	if (newNode.has('children')) {
		newNode = newNode.set('children', removeAllEffects(newNode.get('children')));
	}
	return replaceNode(treeCopy, newNode);
}

function removeNode(nodes, id) {
	return nodes.map(function(node) {
		if (node.get('id') !== id) {
			if (node.has('children')) {
				return node.set('children', removeNode(node.get('children'), id));
			}
			return node;
		}
		return undefined;
	}).filter(Boolean);
}
function getParent(nodes, id) {
	return nodes.map(function(node) {
		if (node.has('children')) {
			const parent = node.get('children').
				find((child) => child.get('id') === id);
			if (parent) {
				return node;
			}

			return getParent(node.get('children'), id);

		}
		return undefined;
	}).filter(Boolean).first();
}

function moveNode(tree, action) {
	const nodes = removeNode(tree, action.getIn([ 'dragged', 'id' ]));
	let target;
	if (action.hasIn([ 'target', 'children' ])) {
		const hoveredChildren = removeNode(action.getIn([ 'target', 'children' ]),
		action.getIn([ 'dragged', 'id' ]));
		target = action.get('target').set('children', hoveredChildren);
	}
	else {
		target = action.get('target');
	}
	const dragged = action.get('dragged');
	const position = action.get('position');
	if (position === Positions.get('INTO')) {
		if (!target.has('children')) {
			target = target.set('children', []);
		}
		const newChildren = List(target.get('children')).push(dragged);
		target = target.set('children', newChildren);
		return replaceNode(nodes, target);
	}

	let parent = getParent(nodes, target.get('id'));
	if (parent) {
		let index = parent.get('children').
				findIndex((child) => child.get('id') === target.get('id'));
		index = (position === Positions.get('BEFORE')) ? index : index + 1;
		parent = parent.set('children',
				parent.get('children').insert(index, dragged));
		return replaceNode(nodes, parent);
	}

	let index =
				nodes.findIndex((obj) => obj.get('id') === target.get('id'));
	index = (position === Positions.get('BEFORE')) ? index : index + 1;
	return nodes.insert(index, dragged);


}

export function dropNode(tree, action, canDrop) {
	if (!canDrop(action)) {
		return tree;
	}
	const treeCopy = removeAllEffects(tree);
	const newAction = action.set('target',
		removeAllEffects(List([ action.get('target') ])).first());

	return moveNode(treeCopy, newAction);
}