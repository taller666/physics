---
title: "静电场中的导体与电介质"
description: ""
draft: false
rightTitle: "例题与补充"
---

# 静电场中的导体与电介质

<!-- 在这里写正文。完成后把上面的 draft: true 改为 draft: false。 -->
## 核心：高斯定理与环路定理
- 微分形式
 $$
 \begin{aligned}
 \nabla \cdot \vec{E} &= \rho/\epsilon_0 \\
 \nabla \times \vec{E} &= 0
 \end{aligned}
 $$
- 积分形式
$$
\begin{aligned}
\int_{\partial V} d\vec{\sigma}\cdot\vec{E}&=Q/\epsilon_0\\
\int_{\partial \sigma} d\vec{l}\cdot\vec{E} &= 0
\end{aligned}
$$
- 边值关系
**由微分方程给出边值关系**
1. 任意约定面的1，2两侧，并定义法向$\hat{n}：1\to2$;
2. 将$\nabla$改写成$\hat{n}$，作用对象（场（电场$\vec{E}$）或源（电荷密度$\rho$））$\vec{F}$改写为$\vec{F_2}-\vec{F_1}$;
3. 删去场对时间的导数项;
4. 源及其对时间的导数向将其中的体密度改为面密度。
![[left_figure/01.png]]
因此我们就能从高斯定理得到边值关系
$$
\begin{aligned}
&\hat{n}\cdot(\vec{E_2}-\vec{E_1})=\sigma/\epsilon_0\\
&\hat{n}\times(\vec{E_2}-\vec{E_1})=0
\end{aligned}
$$
> 以上是基础，为了解决本章的问题还需要掌握导体和电介质的基本性质。

## 导体的基本性质
- 对于Ohm型导体（电导率为有限值，有电阻值），如果均匀导体内部初始不带电，
则此后任一时刻都有$\rho=0$;如果初始时$\rho$不为0，经过很短的时间之后，
$\rho$实际上也会消失。**除非特殊说明，本课程均假设均匀导体内部电荷密度$\rho(t,\vec{x})$
为0**
- 理想导体是Ohm型导体电导率无穷时的极限，因而理想导体内部不可能有自由电荷。
- **本课程讨论的导体内部电场都为0**
- **导体内部电场都为0，意味着导体是个等势体**
## 电容与电容器
- 孤立导体的电容
$$
 C = Q/U
$$
- 电容器：
  两个导体构成的系统；导体A的外表面和导体B的内表面组成的导体系统，即电容器。定义：
  $$
  C = \frac{Q}{|U_A-U_B|}
  $$
  ![[left_figure/电容器.png|300]]

  **只取决于系统的几何结构**告诉我们求解电容的基本方法：
  a. 手动给A加上总电荷Q，分析Q在A上如何分布，因为静电感应B上的电荷如何分布，知道电荷分布回到第一章内容求电场求电势，从而得到AB的电势查U，电容$C=Q/U$
  b. 手动分别给导体A加上电压U，导体B加上电压0，求解在这种情况下A上的总电荷Q，则电容$C = Q/U$
  c. 出现多个导体面的情况，考虑成一个一个电容器串联或并联，按a或b的方法计算单个电容器的电容，串并联公式计算总电容。
- 电容的串联与并联
  如何分析电容的串联和并联？
  串联：每个电容器上带的电荷都是Q
  ![[left_figure/串联.png|300]]
  $$
  \begin{aligned}
  &Q = C_1U_1 = C_2U_2= ... C_{N-1}U_{N-1} = C_N \\
  &U = U_1 + U_2 + ... U_N = \sum_{i=1}^{N}U_i = Q\sum_{i=1}^{N}\frac{1}{C_i}\\
  &\frac{U}{Q}=\sum_{i=1}^{N}1/C_i\\
  &\frac{1}{C} = \sum_{i=1}^{N}\frac{1}{C_i}
  \end{aligned}
  $$

 





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
