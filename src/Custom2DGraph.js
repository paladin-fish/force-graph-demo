import React from 'react';
import './App.css';
import ForceGraph from 'force-graph';
import * as d3 from 'd3-force'

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';

export default class Custom3DGraph extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            data: [],
            dagMode: 'null',
        }
        this.ele = null        // 容器对象
        this.graph = null       // 画布对象

        this.selectedNodes = new Set()   // 当前选中的结点
        this.highlightNodes = new Set();  // 需要高亮的结点
        this.highlightLinks = new Set();  // 需要高亮的线
        this.hoverHighlightNodes = new Set(); // hover状态下，需要高亮的结点
        this.hoverHighlightLinks = new Set(); // hover状态下，需要高亮的线

        this.toAdjustTimer = null;      // 结点自适应屏幕的执行定时器
        this.clickEventTime = null      // 存放点击结点需要执行方法的定时器
    }
    initData = data => {
        data.nodes.map((node) => {  // 如果存在图片，先进行处理
            if (node.img) {
                const img = new Image();
                img.src = node.img;
                node.img = img
            }
        })
        
        // 处理结点的neighbors数据
        data.links.forEach(link => {
            const a = data.nodes.find(bean => bean.id === link.source);
            const b = data.nodes.find(bean => bean.id === link.target);
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
        this.setState({ data: data })
    }

    initGraph = () => {
        this.graph = new ForceGraph()
        this.graph(this.ele)
            .graphData(this.state.data)
            // .width(400).height(400).backgroundColor('#ccc')   // 设置canvas样式的3个方法
            .nodeAutoColorBy('group')   // 根据自定义的type来将同一类node节点颜色统一
            .nodeVal(7)  // node 圈圈的大小
            .nodeLabel('id')  // hover上去显示的内容
            .linkWidth(link => this.highlightLinks.has(link) || this.hoverHighlightLinks.has(link) ? 5 : 1)
            .linkDirectionalParticleWidth(link => this.highlightLinks.has(link) || this.hoverHighlightLinks.has(link) ? 4 : 0)
            .linkDirectionalParticles("value")
            .linkColor(link => this.highlightLinks.size > 0 ? this.highlightLinks.has(link) ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)' : this.hoverHighlightLinks.has(link) ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)')
            .linkDirectionalParticleSpeed(d => d.value * 0.001)
            .nodeCanvasObject((node, ctx, globalScale) => {  // 文字节点
                const label = node.id;
                const fontSize = 12 / globalScale;
                const imgSize = 1.2 * fontSize
                const existImg = !!node.img
                // 添加图片
                ctx.beginPath();
                let r = 7
                ctx.fillStyle = 'rgba(172, 77, 229)';
                if (this.highlightNodes.size > 0) { // 当前有选中结点
                    if (this.highlightNodes.has(node)) {
                        r = 1.2 * r
                    } else {
                        ctx.fillStyle = 'rgba(172, 77, 229, 0.6)';
                    }
                } else {
                    if (this.hoverHighlightNodes.has(node)) { // 当前有hover结点
                        r = 1.2 * r
                    }
                }
                ctx.save(); // 保存当前ctx的状态
                ctx.arc(node.x, node.y, r, 0 * Math.PI, 2 * Math.PI)
                if (existImg) {  // 有图片显示图片
                    ctx.clip(); //裁剪上面的圆形
                    ctx.drawImage(node.img, node.x - r, node.y - r, 2*r, 2*r);
                } else {    // 没图片显示默认
                    ctx.fill()
                }
                ctx.closePath();
                ctx.restore(); // 还原状态
                // 添加文字
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = node.color;
                ctx.fillText(label, node.x, node.y + imgSize);
            })
            .onNodeHover(node => { 
                this.ele.style.cursor = node ? '-webkit-grab' : null;
            })
            .onLinkHover(link => {
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
            .onNodeClick((node, event) => {
                if (this.clickEventTime) {
                    console.log("dblclick");
                    clearTimeout(this.clickEventTime)
                    this.clickEventTime = null;
                    window.open('https://baidu.com')
                } else {
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

                //   this.graph.nodeColor(this.graph.nodeColor()); // update color of selected nodes
            })
            .onBackgroundClick((event) => {
                console.log('# BackgroundClick==', event)
                this.highlightNodes.clear();
                this.highlightLinks.clear();
                this.selectedNodes.clear();
            })
            .onNodeDragEnd(node => {
                node.fx = node.x;
                node.fy = node.y;
              })
            .d3VelocityDecay(.2)
            .d3AlphaDecay(0.02)
            .dagLevelDistance(100)
            .d3Force('link').distance(link => 100);
    }
    componentDidMount() {
        // 异步获取数据
        fetch('./miserables.json').then(res => res.json()).then(data => {
            // 对数据做一些额外处理
            this.initData(data)
            // 渲染graph
            this.initGraph()
        })
    }

    componentDidUpdate() {
        if (this.graph) {
            this.updateGraph()
        }

    }
    updateGraph = () => {
        if (this.state.dagMode !== 'null') {
            this.graph
                .dagMode(this.state.dagMode)
                .d3Force('collide', d3.forceCollide(13))
        } else {
            this.graph
                .dagMode(this.state.dagMode)
                .d3Force('link').distance(link => 100);
        }
    }

    toFitNode = (_node) => {
        if (_node) {
            // 点击将该node移到视图中
            this.graph.centerAt(_node.x, _node.y, 1000);
            this.graph.zoom(8, 2000);
        }
    }
    render() {
        return (
            <div>
                <div style={{
                    zIndex: 1299, position: 'fixed', top: 0, left: 0, backgroundColor: "white", textAlign: 'center', display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '16px'
                }}>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="选择结点"
                        style={{ width: '100px', marginRight: '16px' }}
                        value={this.state.dagMode}
                        onChange={(e, val) => {
                            // this.graph && this.graph.dagMode(val) && (this.defaultControls = val)
                            // console.log(e, val)
                            this.setState({ dagMode: e.target.value })
                            setTimeout(() => {
                                this.graph.zoomToFit(400)
                            }, 1000)
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
                        onChange={(e, node) => { this.toFitNode(node) }}
                        options={this.state.data && this.state.data.nodes || []}
                        getOptionLabel={(option) => option.id}
                        style={{ width: 300 }}
                        clearOnBlur={true}
                        renderInput={(params) => <TextField {...params} label="搜索结点" variant="outlined" />}
                    />
                    <Button onClick={() => {
                        if (this.toAdjustTimer) {
                            clearTimeout(this.toAdjustTimer)
                        }
                        this.toAdjustTimer = setTimeout(() => {
                            this.graph.zoomToFit(400)
                            clearTimeout(this.toAdjustTimer)
                            this.toAdjustTimer = null
                        }, 400)
                    }}>适应屏幕</Button>
                </div>
                <div ref={(ref) => this.ele = ref} >

                </div>
            </div>
        )
    }
}