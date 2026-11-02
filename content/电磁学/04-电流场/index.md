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

**焦耳定律**
电流流过导体，电场对电荷做功，电场做的功即电流的功率为：
$$ 
P=UI=I^2R=U^2/R
$$
电能以发热的形式释放出来：
$$
Q=\Delta A= I^2R\Delta t
$$
单位体积的导体内的电功率称为电功率密度。
$$
p=P/V=\frac{I}{S}\frac{U}{L}=\vec{j}\cdot\vec{E}=j^2/\sigma
$$

## 导电介质
其实就是综合要满足以下方程：
$$
\iint_{\partial V}\vec{D}\cdot d\vec{S}=\sum_{S内}q_{free}
$$
$$
\int_t{\partial S}\vec{E}\cdot\vec{l}=0
$$
$$
\vec{D} = \epsilon \vec{E}
$$
$$
\vec{j}=\sigma\vec{E}
$$
以及一组边值关系:
$$
\hat{n}\times(\vec{E_2}-\vec{E_1})=0
$$
$$
\hat{n}\cdot(\vec{j_2}-\vec{j_1})=0
$$
$$
\hat{n}\cdot(\vec{D_2}-\vec{D_1})=\sigma_{free1}-\sigma_{free2}
$$
>所以这章最综合的题的本质求法还是猜电场，只不过想办法让他们满足这些边值关系

## 电源以及电动势
**电源**
提供非静电力的装置，存在非静电力时，欧姆定律应该改写为：
$$
\vec{j}=\sigma(\vec{E}+\vec{K})
$$
存在洛伦兹力时,欧姆定律应该写为:
$$
\vec{j}=\sigma(\vec{E}+\vec{K}+\vec{v}\times\vec{B})
$$
**电动势**
将单位正电荷从负极经电源内部移到正极时非静电力所作的功，即:
$$
\mathcal{E}=\int_{-}^{+}\vec{K}\cdot d\vec{l}
$$
## 基尔霍夫定律
**基尔霍夫第一方程**
对每一个节点，有：
$$
\sum_{k}I_k=0
$$
**基尔霍夫第二方程**
任意假定绕行方向，绕行方向经过电源内部由正极指向负极时，$\mathcal{E}$取正号，反之取负号。绕行方向与电流方向一致时，取正号，反之取负号
- 对N个节点，有N-1个节点方程
- P条支路，有 P-N+1 个第二方程组
故一共只有P个方程，恰好解P条支路上的电流！
$$
\sum U = \sum (\pm\mathcal{E}\pm Ir\pm IR)=0
$$
## 电流叠加原理
具有几个电动势的电路中，几个电动势共同在某一支路中引起的电流，等于每个电动势单独存在时在该支路上所产生的电流之和。
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
