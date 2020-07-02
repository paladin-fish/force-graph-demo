import React from 'react';
import './App.css';
import ForceGraph from 'force-graph';
import * as dat from 'dat.gui';
import * as d3 from 'd3-force'

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';

export default class Custom3DGraph extends React.Component {
    ele = null
    graph = null
    gui = null
    data=null
    hoverNode = null
    highlightNodes = new Set();
    highlightLinks = new Set();


    hoverHighlightNodes = new Set();
    hoverHighlightLinks = new Set();


    shouldFit = false
    normalZoom = 0
    dagZoom = 0
    defaultControls = 'lr'
    inputEle=null
    toAdjustTimer = null
    selectedNodes = new Set()
    clickEventTime = null
    constructor(props) {
        super(props)
        this.state = {
            mode : 'normal',
            data: [],
            dagMode: 'null',
        }
    }
    initGuiCOntrols = () => {
        // controls
        const controls = { 'DAG Orientation': this.defaultControls};
        this.gui = new dat.GUI();
        this.gui.add(controls, 'DAG Orientation', ['lr', 'td', 'radialin','radialout', null])
        .onChange(orientation => this.graph && this.graph.dagMode(orientation) && (this.defaultControls = orientation));
        // this.gui.hide()
    }
    initData = data => {
        data.nodes.map((node) => {  // 如果存在图片，先进行处理
            if (node.img) {
                const img = new Image();
                img.src = node.img;
                node.img = img
            }
        })
        this.nodesById =  Object.fromEntries(data.nodes.map(node => [node.id, node]));

        data.links.forEach(link => {
            this.nodesById[link.source].childLinks.push(link);
        });
        data.links.forEach(link => {
            const a = data.nodes.find(bean => bean.id ===link.source);
            const b = data.nodes.find(bean => bean.id ===link.target);
            // console.log(data.nodes, a,b)
            !a.neighbors && (a.neighbors = []);
            !b.neighbors && (b.neighbors = []);
            a.neighbors.push(b);
            b.neighbors.push(a);

            !a.links && (a.links = []);
            !b.links && (b.links = []);
            a.links.push(link);
            b.links.push(link);
        });

        this.data = data
        this.setState({data: data})
    }

    initParams = () => {
        this.hoverNode = null;
    }

    initGraph = () => {
        this.graph = new ForceGraph()
        this.graph(this.ele)
        // .width(400).height(400).backgroundColor('#ccc')   // 设置canvas样式的3个方法
        .nodeAutoColorBy('group')   // 根据自定义的type来将同一类node节点颜色统一
        .nodeVal(7)  // node 圈圈的大小
        .nodeLabel((node) => {   // hover到node上显示的文本
            // console.log('node===', node)
            return node.id
        })
        .onNodeHover(node => {
            // this.highlightNodes.clear();
            // this.highlightLinks.clear();
            // if (node) {
            //   this.highlightNodes.add(node);
            //   node.neighbors.forEach(neighbor => this.highlightNodes.add(neighbor));
            //   node.links.forEach(link => this.highlightLinks.add(link));
            // }
            
            this.hoverNode = node || null;
            this.ele.style.cursor = node ? '-webkit-grab' : null;
          })
          .onLinkHover(link => {
            //   console.log(link, this.highlightLinks, this.highlightNodes)
              if (this.selectedNodes.size > 0) {
                  return
              }
            this.hoverHighlightNodes.clear();
            this.hoverHighlightLinks.clear();
    
            if (link) {
              this.hoverHighlightLinks.add(link);
              this.hoverHighlightNodes.add(link.source);
              this.hoverHighlightNodes.add(link.target);
            }
          })
          .linkWidth(link => this.highlightLinks.has(link) || this.hoverHighlightLinks.has(link) ? 5 : 1)
        .nodeCanvasObject((node, ctx, globalScale) => {  // 文字节点
        const label = node.id;
        const fontSize = 12/globalScale;
        const imgSize = 1.2*fontSize
        const existImg = !!node.img
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
        if (existImg) {
            ctx.drawImage(node.img, node.x - bckgDimensions[0] / 2 - imgSize, node.y - fontSize / 2, fontSize, fontSize);
        }

        ctx.beginPath();
        let r = 7
        ctx.fillStyle = 'rgba(172, 77, 229)';
        if (this.highlightNodes.size > 0) { // 当前有选中结点
            if (this.highlightNodes.has(node)) {
                r = 1.2*r
                // ctx.fillStyle = 'rgba(0,0,0,0.6)';
                // ctx.fillRect(node.x - bckgDimensions[0] / 2 - 5, node.y - bckgDimensions[1] / 2 - 5 , bckgDimensions[0] + 10, bckgDimensions[1] + 10);
            } else {
                ctx.fillStyle = 'rgba(172, 77, 229, 0.6)';
            }
        } else {
            if (this.hoverHighlightNodes.has(node)) { // 当前有hover结点
                r = 1.2*r
            }
        }
        // if (this.highlightNodes.has(node) || this.hoverHighlightNodes.has(node)) {
        //     ctx.fillStyle = 'rgba(0,0,0,0.6)';
        //     ctx.fillRect(node.x - bckgDimensions[0] / 2 - 5, node.y - bckgDimensions[1] / 2 - 5 , bckgDimensions[0] + 10, bckgDimensions[1] + 10);
        // } else {
        //     ctx.fillStyle = 'rgba(172, 77, 229)';
        // }
        ctx.arc(node.x,node.y,r,0*Math.PI,2*Math.PI)
        ctx.fill()
        ctx.closePath();
        // ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = node.color;
        ctx.fillText(label, node.x, node.y + imgSize);
        })
        // .onNodeDoubleClick((node, event) => {
        //     console.log('double click====', node, event)
        // })
        .onNodeClick((node, event) => {
            // 点击展开/收缩node child
            // if (node.childLinks.length) {
            //     node.collapsed = !node.collapsed; // toggle collapse state
            //     this.graph.graphData(getPrunedTree());
            // }
            // 点击将该node移到视图中
            // this.graph.centerAt(node.x, node.y, 1000);
            // this.graph.zoom(8, 2000);
            if( this.clickEventTime ){
                console.log("dblclick");
                clearTimeout(this.clickEventTime)
                this.clickEventTime = null;
                window.open('https://baidu.com')
            }else{
                console.log("first click")
                this.clickEventTime = setTimeout(() => {
                    clearTimeout(this.clickEventTime)
                    this.clickEventTime = null;
                    if (event.ctrlKey || event.shiftKey || event.altKey) { // multi-selection
                        if (this.selectedNodes.has(node)) {
                            this.selectedNodes.delete(node)
                            this.highlightNodes.delete(node);
                            node.neighbors.forEach(neighbor => this.highlightNodes.delete(neighbor));
                            node.links.forEach(link => this.highlightLinks.delete(link));
                        } else {
                            this.selectedNodes.add(node)
                            this.highlightNodes.add(node);
                            node.neighbors.forEach(neighbor => this.highlightNodes.add(neighbor));
                            node.links.forEach(link => this.highlightLinks.add(link));
                        }
                    } else { // single-selection
                        if (this.selectedNodes.has(node)) {
                            this.highlightNodes.clear();
                            this.highlightLinks.clear();
                            this.selectedNodes.clear();
                        } else {
                            this.highlightNodes.clear();
                            this.highlightLinks.clear();
                            this.selectedNodes.clear();
                            this.selectedNodes.add(node)
                            if (node) {
                                this.highlightNodes.add(node);
                                node.neighbors.forEach(neighbor => this.highlightNodes.add(neighbor));
                                node.links.forEach(link => this.highlightLinks.add(link));
                            }
                        }
                    }
                }, 200)
            }
            // node 多选
            // if (event.ctrlKey || event.shiftKey || event.altKey) { // multi-selection
            //     selectedNodes.has(node) ? selectedNodes.delete(node) : selectedNodes.add(node);
            //   } else { // single-selection
            //     const untoggle = selectedNodes.has(node) && selectedNodes.size === 1;
            //     selectedNodes.clear();
            //     !untoggle && selectedNodes.add(node);
            //   }
    
            //   this.graph.nodeColor(this.graph.nodeColor()); // update color of selected nodes
        })
        .onBackgroundClick((event) => {
            console.log('#event==', event)
            this.highlightNodes.clear();
            this.highlightLinks.clear();
            this.selectedNodes.clear();
        })
        .linkDirectionalParticleWidth(link => this.highlightLinks.has(link)  || this.hoverHighlightLinks.has(link) ? 4 : 0)
        .linkDirectionalParticles("value")
        .linkColor(link => this.highlightLinks.size > 0? this.highlightLinks.has(link) ? 'rgba(0,0,0,0.4)': 'rgba(0,0,0,0.05)' :  this.hoverHighlightLinks.has(link)? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)')
        .linkDirectionalParticleSpeed(d => d.value * 0.001)
        // .nodeCanvasObjectMode(node => highlightNodes.has(node) ? 'after' : undefined)
        // .onNodeDragEnd(node => {
        //     node.fx = node.x;
        //     node.fy = node.y;
        //   })
          
          .d3VelocityDecay(.2)
          .d3AlphaDecay(0.02)
          .dagLevelDistance(100)
        .graphData(this.data);

        this.graph.d3Force('link').distance(link =>100);
        // fit to canvas when engine stops
        // this.graph.onEngineStop(() => {
        //     if (this.shouldFit) {
        //         this.shouldFit = false;
        //         this.graph.zoomToFit()
        //     }
        // })
    }
    componentDidMount(){
    
        //  this.initGuiCOntrols()
        fetch('./miserables.json').then(res => res.json()).then(data => {
            this.initData(data)
            this.initGraph()
        
        })        
    }


    // ***************** node展开/收缩 start ***************
    getPrunedTree = () => {
        const visibleNodes = [];
        const visibleLinks = [];
  
        (function traverseTree(node = this.nodesById["root"]) {
          visibleNodes.push(node);
          if (node.collapsed) return;
          visibleLinks.push(...node.childLinks);
          node.childLinks
            .map(link => ((typeof link.target) === 'object') ? link.target : this.nodesById[link.target]) // get child node
            .forEach(traverseTree);
        })(); // IIFE
  
        return { nodes: visibleNodes, links: visibleLinks };
    };

    showDagMode = () => {
            // graph config
            // this.graph = ForceGraph()
            // this.shouldFit = true
            this.graph
            // .backgroundColor('#101020')
            // .linkColor(() => 'rgba(255,255,255,0.2)')
            .dagMode(this.defaultControls)
            .dagLevelDistance(100)
            .nodeId('id')
            .linkCurvature(0.07)
            // .linkDirectionalParticles(2)
            // .linkDirectionalParticleWidth(3)
            // .nodeCanvasObject((node, ctx) => {
            //     const label = node.package;
            //     const fontSize = 15;
            //     ctx.font = `${fontSize}px Sans-Serif`;
            //     const textWidth = ctx.measureText(label).width;
            //     const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

            //     ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            //     ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

            //     ctx.textAlign = 'center';
            //     ctx.textBaseline = 'middle';
            //     ctx.fillStyle = 'lightsteelblue';
            //     ctx.fillText(label, node.x, node.y);
            // })
            .d3Force('collide', d3.forceCollide(13))
            .d3AlphaDecay(0.02)
            .d3VelocityDecay(0.3);

            if (this.dagZoom) {
                this.graph.zoom(this.dagZoom)
            }
    }
    componentDidUpdate(){
        if (this.graph) {
            // if (this.state.dagMode !== 'null') {
            //     // this.gui.show()
            //     // this.initGuiCOntrols()
            //     this.showDagMode()
            // } else {
            //     // this.gui.hide()
            //     // if (this.gui) {
            //     //     this.gui.destroy()
            //     //     this.gui = null
            //     // }
            //     this.showNormalMode()
            // }
            this.updateGraph()
        }
        
    }
    updateGraph = () => {
        // console.log('zoom: ', this.graph.zoom())
        // this.shouldFit = true
        if (this.state.dagMode !== 'null') {
            this.graph
            .dagMode(this.state.dagMode)
            // .linkCurvature(0.2)
            .d3Force('collide', d3.forceCollide(13))
        } else {
            this.graph
                .dagMode(this.state.dagMode)
                // .linkCurvature(0.07)
                .d3Force('link').distance(link =>100);
        }
        // this.graph.zoom(4 / Math.cbrt(this.data.nodes.length))
    }
    showNormalMode = () => {
        // this.graph = new ForceGraph()
        // this.shouldFit= true
        this.graph
        .backgroundColor('transparent')
        .dagMode('null')
        .linkColor(() => '#f3f3f3')
        // .width(400).height(400).backgroundColor('#ccc')   // 设置canvas样式的3个方法
            .d3VelocityDecay(.2)
        .linkDirectionalParticleWidth(link => this.highlightLinks.has(link) ? 4 : 0)
            .linkDirectionalParticles("value")
            .linkDirectionalParticleSpeed(d => d.value * 0.001)
            .d3Force('link').distance(link =>100);
    
            // this.graph.refresh()

            if (this.normalZoom) {
                this.graph.zoom(this.normalZoom)
            }
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
        console.log('gData=-=-', gData)
        return gData
    }
    toFitNode = (_node) => {
        if (_node) {
            // 点击将该node移到视图中
            this.graph.centerAt(_node.x, _node.y, 1000);
            this.graph.zoom(8, 2000);
        }   
    }
    render(){
        // console.log('mode: ', this.state.mode)
        return (
            <div>
                <div style={{zIndex: 1299, position:'fixed', top: 0, left:0, backgroundColor: "white", textAlign:'center',display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px' }}>
                    <div style={{
                        width: '100px',
                        border: '1px solid #ccc',
                        padding: '10px 16px',
                        borderRadius: '5px',
                        marginRight: '16px',
                        cursor: 'pointer'
                    }} onClick={()=>{
                    // console.log('click');
                    if (this.state.mode === 'normal') {
                        this.normalZoom = this.graph.zoom()
                    } else {
                        this.dagZoom = this.graph.zoom()
                    }
                    this.setState({mode: this.state.mode === "normal" ? "dag" : "normal"})
                }} >toggle</div>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="选择结点"
                        style={{width: '100px', marginRight: '16px'}}
                        value={this.state.dagMode}
                        onChange={(e,val) => {
                            // this.graph && this.graph.dagMode(val) && (this.defaultControls = val)
                            // console.log(e, val)
                            this.setState({dagMode: e.target.value})
                            setTimeout(() => {
                                this.graph.zoomToFit(400)
                            },1000)
                        }}
                        >
                        <MenuItem value={'null'}>默认</MenuItem>
                        <MenuItem value={'lr'}>左往右</MenuItem>
                        <MenuItem value={'td'}>上往下</MenuItem>
                        <MenuItem value={'radialin'}>结点朝内</MenuItem>
                        <MenuItem value={'radialout'}>结点朝外</MenuItem>
                    </Select>
                    <Autocomplete
                        id="combo-box-demo"
                        onChange={(e,node)=>{this.toFitNode(node)}}
                        options={this.state.data && this.state.data.nodes || []}
                        getOptionLabel={(option) => option.id}
                        style={{ width: 300 }}
                        clearOnBlur={true}
                        renderInput={(params) => <TextField {...params} label="搜索结点" variant="outlined" />}
                        />
                        <Button onClick={()=>{
                            if (this.toAdjustTimer) {
                                clearTimeout(this.toAdjustTimer)
                            }
                            this.toAdjustTimer = setTimeout(() => {
                                this.graph.zoomToFit(400)
                                clearTimeout(this.toAdjustTimer)
                                this.toAdjustTimer = null
                            },400)
                        }}>适应屏幕</Button>
                </div>
                <div  ref={(ref) => this.ele= ref} >

                </div>
            </div>
        )
    }
}