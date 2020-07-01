import React from 'react';
import './App.css';
import ForceGraph3D from '3d-force-graph';


export default class Custom3DGraph extends React.Component {
    ele = null
    componentDidMount(){
        console.log('didmount')
        const myGraph = new ForceGraph3D()
        // console.log(this.ele,'=-=-', this.ele)
        myGraph(this.ele)
        .width(400).height(400)
            .graphData(this.randomData());
    
        // fetch('./miserables.json').then(res => res.json()).then(data => {
        //     data.nodes.map((node) => {  // 如果存在图片，先进行处理
        //         if (node.img) {
        //             const img = new Image();
        //             img.src = node.img;
        //             node.img = img
        //         }
        //     })
        // const myGraph = new ForceGraph3D()
        // myGraph(this.ele)
        // .width(400).height(400)   // 设置canvas样式的3个方法
        // .nodeAutoColorBy('group')   // 根据自定义的type来将同一类node节点颜色统一
        // .nodeVal(3)  // node 圈圈的大小
        // .nodeLabel((node) => {   // hover到node上显示的文本
        //     return node.id
        // })
        // .nodeThreeObject(node => {
        //     // use a sphere as a drag handle
        //     const obj = new THREE.Mesh(
        //       new THREE.SphereGeometry(10),
        //       new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 })
        //     );
  
        //     // add text sprite as child
        //     const sprite = new SpriteText(node.id);
        //     sprite.color = node.color;
        //     sprite.textHeight = 8;
        //     obj.add(sprite);
  
        //     return obj;
        //   })
        // .graphData(data);
        // })
    }

    componentWillUnmount(){
        console.log('umount')
    }

    randomData = () => {
        const N = 200;
        const gData = {
          nodes: [...Array(N).keys()].map(i => ({ id: i })),
          links: [...Array(N).keys()]
            .filter(id => id)
            .map(id => ({
              source: id,
              target: Math.round(Math.random() * (id-1))
            }))
        };
        return gData
    }

    render(){
        return (
            <div id="graph" ref={(ref) => this.ele= ref}>

            </div>
        )
    }
}