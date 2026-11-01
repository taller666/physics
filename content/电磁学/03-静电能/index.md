---
title: "静电能"
description: ""
draft: false
rightTitle: "例题与补充"
---

## N个点电荷系统的静电能
在这里我们讨论点电荷系统的静电能，只讨论整个系统的**相互作用能**。
$$
W_{互}=\frac{1}{2}\sum_{i=1}^{N}q_iU_i
$$
$U_i$表示除自身外，所有其它点电荷在该处所产生的电势，￥q_i￥表示该点电荷的电荷量。
$$
U_i = \sum_{j=1,j\neq i}^{N}U_{ji}=\frac{1}{4\pi\epsilon_0}\frac{q_j}{r_{ij}}
$$
因此，
$$
W_{互}=\frac{1}{8\pi\epsilon_0}\sum_{i=1}^{N}\sum_{j=1}^{N}\frac{q_iq_j}{r_{ij}}
$$
## 连续电荷分布的静电能
**体电荷与面电荷分布**
体电荷：$W_e=\frac{1}{2}\iiint_V\rho_e(r)U(r)dV$
面电荷：$W_e=\frac{1}{2}\iint_S\sigma_e(r)U(r)dS$
其中$\rho_e(r)$是体电荷密度，$\sigma_e(r)$是面电荷密度，$U(r)$是r处的总电势。原理上，从N个点电荷系统的静电能推广过来，此处应该是$U_1(r)$即，除$\rho_e(r)dV$以外所有电荷产生的电势。但可以证明，对体电荷面电荷分布体系$U(r)$和$U_1(r)$的差别可以忽略。
**线电荷分布**
线电荷的静电能计算会遇见发散，超出本课程的学习范围。。。原因是，本身讲电荷从无限分散状态压缩在一条线上，外界也要做无穷大的功。。。
## 多个带电体的静电能
$$
\begin{aligned}
W_e &= \frac{1}{2}\sum_{i=1}^{N}\iiint_{V_i}\rho_e{r}U(r)dV\\
    &= \frac{1}{2}\sum_{i=1}^{N}\iiint_{V_i}\rho_e(r)U^{(i)}(r)dV+\frac{1}{2}\sum_{i=1}^{N}\iiint_{V_i}\rho_i(r)U_i(r)dV
\end{aligned}
$$
- $U_i(r)$表示除第i个带电体外所有其他带电体在r处产生的电势‘
- $U^{(i)}(r)$表示第i个带电体在r处产生的电势。
由此总静电能，可以被拆分为两份：
$$
\begin{aligned}
W_e = W_{自能}+W_{相互作用能}
W_{自能} &=  \frac{1}{2}\sum_{i=1}^{N}\iiint_{V_i}\rho_e(r)U^{(i)}(r)dV\\
W_{相互作用能} &= \frac{1}{2}\sum_{i=1}^{N}\iiint_{V_i}\rho_i(r)U_i(r)dV\\
\end{aligned}
$$
> 这一组式子在计算一堆导体的静电能时非常好用，因为导体是个等势体，相当于计算每个导体的电势，称上对应的总电荷，求和乘上$\frac{1}{2}$即是总的静电能

## 电介质中的静电能
**宏观静电能**

$$
\rho(\vec{r})=\rho_0(\vec{r})+\rho'(\vec{r})=\text{自由电荷}+\text{极化电荷}
$$

$$
W_{e0}=\frac{1}{2}\iiint_{V_0}\rho_0(\vec{r})U(\vec{r})\,dV
+\frac{1}{2}\iiint_{V'}\rho'(\vec{r})U(\vec{r})\,dV
$$

**静电能与极化功**

系统的静电能为在建立该状态过程中外界对系统做的功。外界不仅要克服宏观电荷（$\rho$ 和 $\rho'$）之间的静电力做功（宏观静电能），还要克服分子内部或之间（位移极化或取向极化）的相互作用做功（极化功）。

实际上，静电能为：

$$
W_{e}=\frac{1}{2}\iiint_{V_0}\rho_0(\vec{r})U(\vec{r})\,dV
$$

故对应的极化功为：

$$
W_{\text{极}}=W_{e}-W_{e0}=-\frac{1}{2}\iiint_{V}\rho'(\vec{r})U(\vec{r})\,dV
$$
## 静电能-电场的能量
**静电能密度**
$$w_e=\frac{1}{2}\vec{D}\cdot\vec{E}$$
**电场的总能量**
$$W_e=\iiint_{V}w_edV=\frac{1}{2}\iiint_V\vec{D}\cdot\vec{E}$$
**宏观静电能密度与极化能密度**
$$
\begin{aligned}
w_e &= \frac{1}{2}\vec{D}\cdot\vec{E}=\frac{1}{2}(\epsilon_0\vec{E}+\vec{P})\\
    &=\frac{1}{2}\epsilon_0 E^2+\frac{1}{2}\vec{P}\cdot\vec{E}\\
    &=宏观静电能密度+极化能密度
\end{aligned}
$$
即宏观静电能：
$$
W_{e0}=\frac{1}{2}\iiint\epsilon_0E^2dV
$$
极化能：
$$
W_{极}=\frac{1}{2}\iiint\vec{P}\cdot\vec{E}dV
$$
>这一串式子是我最喜欢用的式子，因为它确实好记，按套路求完电场后，很容易就得到静电能密度。只需要暴力积分就行，而通常考试时，暴力积分积错了扣不了几分，这导致其实能容易的拿高分！

## 带电体系的受力
**绝缘孤立带电体（q不变）**
第i个带电体，在$q_i$不变的情况下，受力：
$$
\vec{F}_i\cdot d\vec{r}=-(dW_e)_q
$$
即：
$$
F_{ix}dx_i+F_{iy}dy_i+F_{iz}dz_i=-[(\frac{\partial W_e}{\partial x_i})_qdx_i
+(\frac{\partial W_e}{\partial y_i})_qdy_i+(\frac{\partial W_e}{\partial z_i})_qdz_i]
$$
即：
$$
F_{ix} = (\frac{\partial W_e}{\partial x_i})_q
$$
$$
F_{iy} = (\frac{\partial W_e}{\partial y_i})_q
$$
$$
F_{iz} = (\frac{\partial W_e}{\partial z_i})_q
$$
$$
F_i = -(\nabla_i W_e)_q
$$
**非孤立带电体（U不变）**
如果存在外电源，使得各导体$U_j$不变，
$$
F_i = + (\nabla_i W_e)_U
$$
>要求某导体受力，直接求完静电能对对应方向求导即可。只是要注意是电荷不变还是电压不变，这会影响正负号，考试只要正负号错，即算全错！！！

<!-- 在这里写正文。完成后把上面的 draft: true 改为 draft: false。 -->

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
