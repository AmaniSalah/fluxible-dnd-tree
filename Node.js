import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DragSource, DropTarget } from 'react-dnd';
import ItemTypes from './ItemTypes';
import FontAwesome from 'react-fontawesome';
import ReactDOM from 'react-dom';


const style = {
	// border: '1px dashed gray',
	padding: '0.5rem 1rem',
	marginBottom: '.5rem',
	width: '20rem',
}


const nodeSource = {
	beginDrag(props) {
        return props;
	},
    endDrag(props, monitor) {
		const droppedObj = monitor.getDropResult();

        // preventing a node to be dropped inside itself
		let hasDropTarget = droppedObj && droppedObj.props && droppedObj.props.node;
		let droppedIntoItself = hasDropTarget && droppedObj.props.node.id === props.node.id;
        if(hasDropTarget && !droppedIntoItself){
			const droppedTo = droppedObj.props;
			const dropPosition = droppedObj.dropPos;
			props.addNode(props, droppedTo, dropPosition);
		}
    },
}

const nodeTarget = {
	hover(props, monitor, component) {
		if(component.props.collapsed){
			component.props.testToggle();
		}
        const dragged  = monitor.getItem();
        const droppedTo  = props;
        // TODO Do some stuff when on hover
		const draggedIndex = monitor.getItem().node.id;
		const dropToIndex = props.node.id;
		const hoverBoundingRect = ReactDOM.findDOMNode(component).getBoundingClientRect();

		// Get vertical middle
		const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
		const hoverEightY = (props.node.type == 'search') ? 0 : (hoverBoundingRect.bottom - hoverBoundingRect.top) / 8;


		// Determine mouse position
		const clientOffset = monitor.getClientOffset();

		// Get pixels to the top
		const hoverClientY = clientOffset.y - hoverBoundingRect.top;

		var dropPos = null;
		// Dragging downwards
		if (hoverClientY <= (hoverMiddleY - hoverEightY)) {
			dropPos = 'before';
			component.setState({'isHoverBefore': true});
			component.setState({'isHoverAfter': false});

		}

		// Dragging upwards
		else if (hoverClientY > (hoverMiddleY + hoverEightY )) {
			dropPos = 'after';
			component.setState({'isHoverBefore': false});
			component.setState({'isHoverAfter': true});

		}

		else {
			dropPos = 'into';
			component.setState({'isHoverBefore': false});
			component.setState({'isHoverAfter': false});
		}
		return dropPos;


    },
    drop(props, monitor, component) {
        // monitor.didDrop() checkes if the event was handled by a nested (child) node.
		let didDrop = monitor.didDrop();
		let isHoveringOnThisNode = monitor.isOver({shallow: true});
		if(!didDrop){

			const draggedIndex = monitor.getItem().node.id;
			const dropToIndex = props.node.id;

			let draggedEl = document.getElementById("node_"+draggedIndex);
			let droppedToEl = document.getElementById("node_"+dropToIndex);
			let position = draggedEl.compareDocumentPosition(droppedToEl);
			// console.log(position);
			// console.log("following", position & 0x04);
			// console.log("preceding", position & 0x02);
			//
			// if( position & 0x04) {
			//   console.log("Dragged before hover");
			//  	}
			//  	if( position & 0x02){
			//   console.log("Hovered is before Dragged");
			// }
			let draggedBefore = position & 0x04;
			let deoppedBefore = position & 0x02;
			// Determine rectangle on screen
			const hoverBoundingRect = ReactDOM.findDOMNode(component).getBoundingClientRect();

			// Get vertical middle
			const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
			const hoverEightY = (props.node.type == 'search') ? 0 : (hoverBoundingRect.bottom - hoverBoundingRect.top) / 8;


			// Determine mouse position
			const clientOffset = monitor.getClientOffset();

			// Get pixels to the top
			const hoverClientY = clientOffset.y - hoverBoundingRect.top;

			var dropPos = null;
			// Dragging downwards
			if (hoverClientY <= (hoverMiddleY - hoverEightY)) {
				console.log(" Before Node");
				dropPos = 'before';
			}

			// Dragging upwards
			else if (hoverClientY > (hoverMiddleY + hoverEightY)) {
				console.log(" After Node");
				dropPos = 'after';

			}

			else{
				console.log(" Into Node");
				dropPos = 'into';
			}


            // these (props which is the node that I dropped into) are available to the nodesource as monitor.getDropResult()
			return {'props':props, 'dropPos': dropPos};
        }
    },
};


@DropTarget(ItemTypes.NODE, nodeTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isHovering: monitor.isOver({ shallow: true })
}))
@DragSource(ItemTypes.NODE, nodeSource, (connect, monitor) => ({
	connectDragSource: connect.dragSource(),
	isDragging: monitor.isDragging()
}))
class Node extends Component {
    static propTypes = {
        connectDragSource: PropTypes.func.isRequired,
        connectDropTarget: PropTypes.func.isRequired,
        isDragging: PropTypes.bool.isRequired,
        testToggle: PropTypes.func.isRequired,
        node: PropTypes.any.isRequired,
        children: PropTypes.node,
        addNode: PropTypes.func.isRequired,
        isHovering: PropTypes.bool.isRequired,
		isHoverBefore: PropTypes.bool.isRequired,
		isHoverAfter: PropTypes.bool.isRequired,
		collapsed: PropTypes.bool.isRequired

	}

	render() {
        const { isDragging, connectDragSource, connectDropTarget, testToggle, node, children, isHovering, isHoverBefore, isHoverAfter, collapsed} = this.props;
        const opacity = isDragging ? 0.4 : 1;
		let shade = (isHovering && !isDragging && !isHoverBefore && !isHoverAfter && node.type !=='search') ? {backgroundColor: '#e4dedd'} : {backgroundColor: 'transparent'};

		let hoveringBeforeNode = isHoverBefore && isHovering && !isDragging;
		let hoverBeforeVisibility = hoveringBeforeNode ? 'visible' : 'hidden';

		let hoveringAfterNode = isHoverAfter && isHovering && !isDragging;
		let hoverAfterVisibility = hoveringAfterNode ? 'visible' : 'hidden';

		let visibility = (collapsed) ? 'none' : 'block';
		let statusIcon = (collapsed) ? 'plus' : 'minus';

		if(node.rootNode){
				return connectDropTarget(
					<div>
						<ul id={"node_"+node.id} style={{ listStyleType: 'none'}} >{children}</ul>
						{ isHovering && <hr />}
					</div>

		        );
		}else{
				return connectDragSource(connectDropTarget(
		            <li id={"node_"+node.id}
		                key={node.id}
		                style={{
		                    ...style,
							...shade,
		                    opacity,
		                    cursor: 'move'
		                }}

		            >



						<hr style={{visibility: hoverBeforeVisibility}} id="before"/>
		                <input
		                    type="checkbox"
							checked={collapsed}
		                    onChange={testToggle}
		                />
						<FontAwesome
					        name={node.type}
					        style={{ textShadow: '0 1px 0 rgba(0, 0, 0, 0.1)' }}
					      />
		                <small  > {node.title } </small>

		                <ul  style={{ listStyleType: 'none', display: visibility}}>
		                    {children}
		                </ul>
						<hr style={{visibility: hoverAfterVisibility}} id="before"/>

		            </li>
					,
		        ));

		}

	}
}

export default class StatefulNode extends Component {
    constructor(props) {
        super(props);
		this.state = {
			hoverBefore: false,
			hoverAfter: false,
			collapsed: false,
		}
    }



	render() {
		return (
			<Node
				{...this.props}
				node={this.props.node}
				isHoverBefore = {this.state.hoverBefore}
				isHoverAfter = {this.state.hoverAfter}
				collapsed = {this.state.collapsed}
				testToggle={() => this.changeCollapsedState()}
			/>
		)
	}

	changeCollapsedState() {
		this.setState({
			collapsed: !this.state.collapsed
		});
	}


}
