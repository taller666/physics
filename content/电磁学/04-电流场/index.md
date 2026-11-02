---
title: "电流场"
description: ""
draft: false
rightTitle: "例题与补充"
---

# 电流场

<!-- 在这里写正文。完成后把上面的 draft: true 改为 draft: false。 -->
## 电流强度与电流密度
时间间隔$dt$内通过某一截面的电量为$dQ$，则电流强度为：
$$
I = \frac{dQ}{dt}
$$
考虑导体中的一个点，在该店沿电流方向作一个
单位矢量$n_0$，并取一面元$\Delta S_0$与$n_0$垂直，
设通过$\Delta S_0$的电流强度为$\Delta I$，则定义P点处电流密度的大小为:
$$
\vec{j} = \frac{dI}{dS_0}\vec{n}
$$
## 电流的连续性方程
流出或流进一个空间的电荷等于该空间电荷总量的变化量，所以有：
$$
\iint_{\partial S}\vec{j}\cdot d\vec{S}=-\frac{d}{dt}\iiint_{V}\rho_e dV
$$
利用第一章讲的方法，很轻易的就能写出微分形式：
$$
\nabla\cdot\vec{j}+\frac{\partial \rho_e}{\partial t}=0
$$
## 稳恒条件
空间任一封闭曲面内的电量保持不变。即任何地点，流失的电荷必须来自于别处留来的电荷所补充。此时，电流密度满足：
$$
\iint_{\partial S}\vec{j}\cdot d\vec{S}=0
$$
微分形式为：
$$
\nabla\cdot\vec{j}=0
$$
此时自然有：
$$
\frac{\partial \rho}{\partial t}=0
$$
按第二章的方法，轻松得到边值关系：
$$
\hat{n}\cdot(\vec{j_1}-\vec{j_2})=0
$$
>本章的题目几乎都是讨论稳恒电流！
## 欧姆定律
**微分形式**
金属中的电流密度与电场强度成正比：
$$
\vec{j}=\sigma\vec{E}
$$
比例系数$\sigma$称为金属的电导率。

电导率$\sigma$倒数称为电阻率，用$\rho$表示
$$
\rho = \frac{1}{\sigma}
$$

**电阻**
$$
\Delta U = \int \vec{E}\cdot d\vec{l}=\int \rho\vec{j}\cdot d\vec{l}=I\int \frac{\rho dl}{S}
$$
则电阻R：
$$
R = \int\frac{\rho dl}{S}
$$
> 其实可以不用记公式，只要记得本章有个额外的边值关系来自于电流连续性方程，而且通常只考虑稳恒条件，这个边值关系就变得很简单$\hat{n}\cdot(\vec{j_1}-\vec{j_2})=0$，
<!--
公式：行内使用 $...$，独立公式使用单独成行的 $$ ... $$。
右栏自动图片：把图片放进本章 right/，按 01.png、02.png 等命名。
自排右栏：需要时把 templates/章节模板/right.md 复制到本章目录后编辑。
不要创建空 right.md：它会优先替代 right/ 的自动图片画廊。
附件示例：[下载讲义](files/讲义.pdf)
PDF 内嵌阅读：![[files/讲义.pdf]] 或 ![手写笔记](files/讲义.pdf)
正文插图示例：![[right/01.png]] 或 ![示意图](right/01.png)
可选 frontmatter：slug 固定网址；order 调整次序；layout: article 隐藏右栏。
-->
