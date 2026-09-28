---
title: 静电场
slug: electrostatics
description: 2026年秋电磁学C第一次习题课：库仑定律、静电场的基本性质与数学工具
order: 1
rightTitle: 原题截图
---

**数学**
 - 矢量：
   $$
   \vec{r}=x \hat{x} + y \hat{y} +z \hat{z}
  $$
  $$
  \vec{r} = r sin\theta cos\phi \hat{x} + r sin\theta sin\phi \hat{y} + r cos\theta \hat{z}
 $$
 $$
 \vec{r} = \rho cos\theta \hat{x} + \rho sin\theta \hat{y} + z \hat{z}
 $$
 - 内积：
 $$
 \hat{x}\cdot\hat{y}=\hat{x}\cdot\hat{z}=\hat{y}\cdot\hat{z}=0
$$
  $$
 \hat{x}\cdot\hat{x}=\hat{y}\cdot\hat{y}=\hat{z}\cdot\hat{z}=1
 $$
 $$
 \begin{aligned}
 \vec{A}=&A_x\hat{x}+A_y\hat{y}+A_z\hat{z}\\
 \vec{B}=&B_x\hat{x}+B_y\hat{y}+B_z\hat{z}\\
 \vec{A}\cdot\vec{B}=&(A_x\hat{x}+A_y\hat{y}+A_z\hat{z})\cdot(B_x\hat{x}+B_y\hat{y}+B_z\hat{z})\\
 =&A_xB_x+A_yB_y+A_zB_z
 \end{aligned}
 $$
 
 - 叉乘：
 
 $$
 \hat{x}\times\hat{y}=\hat{z}
$$
$$
 \hat{y}\times\hat{z}=\hat{x}
$$
$$
 \hat{z}\times\hat{x}=\hat{y}
$$
$$
\begin{aligned}
 \vec{A}=&A_x\hat{x}+A_y\hat{y}+A_z\hat{z}\\
 \vec{B}=&B_x\hat{x}+B_y\hat{y}+B_z\hat{z}\\
 \vec{A}\times\vec{B}=&(A_x\hat{x}+A_y\hat{y}+A_z\hat{z})\times(B_x\hat{x}+B_y\hat{y}+B_z\hat{z})\\
 =&A_xB_y\hat{x}\times\hat{y}+A_yB_x\hat{y}\times\hat{x}\\
 +&A_yB_z\hat{y}\times\hat{z}+A_zB_y\hat{z}\times\hat{y}\\
 +&A_zB_x\hat{z}\times\hat{x}+A_xB_z\hat{x}\times\hat{z}\\
 =&(A_xB_y-A_yB_x)\hat{z}+(A_zB_y-A_yB_z)\hat{x}+(A_zB_x-A_xB_z)\hat{y}
\end{aligned}
$$
 - 并矢：
 $$
 \begin{aligned}
 \vec{A}=&A_x\hat{x}+A_y\hat{y}+A_z\hat{z}\\
 \vec{B}=&B_x\hat{x}+B_y\hat{y}+B_z\hat{z}\\
 \vec{A}\vec{B}=&(A_x\hat{x}+A_y\hat{y}+A_z\hat{z})(B_x\hat{x}+B_y\hat{y}+B_z\hat{z})\\
 =&A_xB_x \hat{x}\hat{x} + A_xB_y \hat{x}\hat{y}+A_xB_z\hat{x}\hat{z}\\
 +&A_yB_x \hat{y}\hat{x} + A_yB_y \hat{y}\hat{y}+ A_yB_z\hat{y}\hat{z}\\
 +&A_zB_x \hat{z}\hat{x} + A_zB_y \hat{z}\hat{y}+ A_zB_z\hat{z}\hat{z}\\
 \end{aligned}
 $$
 - 梯度算符：$\nabla=\frac{\partial}{\partial x}\hat{x}+\frac{\partial}{\partial y}\hat{y}+\frac{\partial}{\partial z}\hat{z}$
   球坐标下梯度算符：$\nabla = \frac{\partial}{\partial r}\hat{r}+\frac{1}{r}\frac{\partial}{\partial \theta} +\frac{1}{rsin\theta}\frac{\partial}{\partial \phi}\hat{\phi}$
   >梯度算符就相当于一个矢量，直角坐标的形式必须记住，球坐标可以记，考试记不住球坐标，换成直角坐标暴力求导不会扣分
 - 梯度算符作用于标量：
  $$
 \begin{aligned}
 \nabla f(\vec{r}) =& (\frac{\partial}{\partial x}\hat{x}+\frac{\partial}{\partial y}\hat{y}+\frac{\partial}{\partial z}\hat{z})f(\vec{r})\\
   =&\frac{\partial f(\vec{r})}{\partial x}\hat{x}+\frac{\partial f(\vec{r})}{\partial y}\hat{y}+\frac{\partial f(\vec{r})}{\partial z}\hat{z}
 \end{aligned}
 $$
   散度（梯度算符与矢量的内积）：
 $$
 \vec{f}(\vec{r})=f_x(\vec{r})\hat{x}+f_y(\vec{r})\hat{y}+f_z(\vec{r})\hat{z}
 $$
 $$
 \begin{aligned}
 \nabla \cdot \vec{f}(\vec{r})=&(\frac{\partial}{\partial x}\hat{x}+\frac{\partial}{\partial y}\hat{y}+\frac{\partial}{\partial z}\hat{z})\cdot(f_x(\vec{r})\hat x+f_y(\vec{r})\hat{y}+f_z(\vec{r})\hat{z})\\
 =&(\frac{\partial f_x(\vec{r})}{\partial x} \hat{x}\cdot\hat{x}+\frac{\partial f_y(\vec{r})}{\partial y} \hat{y}\cdot\hat{y}+\frac{\partial f_z(\vec{r})}{\partial z} \hat{z}\cdot\hat{z})\\=&\frac{\partial f_x(\vec{r})}{\partial x}+\frac{\partial f_y(\vec{r})}{\partial y}+\frac{\partial f_z(\vec{r})}{\partial z}
\end{aligned}
 $$
   旋度（梯度算符与矢量的叉乘）：
 $$
 \begin{aligned}
 \nabla \times \vec{f}(\vec{r})=&(\frac{\partial}{\partial x}\hat{x}+\frac{\partial}{\partial y}\hat{y}+\frac{\partial}{\partial z}\hat{z})\times(f_x(\vec{r})\hat x+f_y(\vec{r})\hat{y}+f_z(\vec{r})\hat{z})\\
 =&(\frac{\partial f_y(\vec{r})}{\partial x}\hat{x}\times\hat{y}+\frac{\partial f_z(\vec{r})}{\partial x}\hat{x}\times\hat{z}+\frac{\partial f_x(\vec{r})}{\partial y}\hat{y}\times\hat{x}+\frac{\partial f_z(\vec{r})}{\partial y}\hat{y}\times\hat{z}+\frac{\partial f_x(\vec{r})}{\partial z}\hat{z}\times\hat{x}+\frac{\partial f_y(\vec{r})}{\partial z}\hat{z}\times\hat{y})\\
 =&(\frac{\partial f_y(\vec{r})}{\partial x}-\frac{\partial f_x(\vec{r})}{\partial y})\hat{z}+(\frac{\partial f_x(\vec{r})}{\partial z}-\frac{\partial f_z(\vec{r})}{\partial x})\hat{y}+(\frac{\partial f_z(\vec{r})}{\partial y}-\frac{\partial f_y(\vec{r})}{\partial z})\hat{x}
 \end{aligned}
 $$
 并（梯度算符与矢量的叉乘）：
 $$
 \begin{aligned}
 \nabla\vec{f}(\vec{r})=&(\frac{\partial}{\partial x}\hat{x}+\frac{\partial}{\partial y}\hat{y}+\frac{\partial}{\partial z}\hat{z})(f_x(\vec{r})\hat x+f_y(\vec{r})\hat{y}+f_z(\vec{r})\hat{z})\\
 
 \end{aligned}
 $$
 拉普拉斯算子$\nabla^2$  
 $$
 \begin{aligned}
 \nabla^2f(\vec{r})=&\nabla\cdot\nabla f(\vec{r})\\
 =&(\frac{\partial}{\partial x}\hat{x}+\frac{\partial}{\partial y}\hat{y}+\frac{\partial}{\partial z}\hat{z})\cdot(\frac{\partial}{\partial x}\hat{x}+\frac{\partial}{\partial y}\hat{y}+\frac{\partial}{\partial z}\hat{z})f(\vec{r})\\
 =&(\frac{\partial^2}{\partial x^2}+\frac{\partial^2}{\partial y^2}+\frac{\partial^2}{\partial z^2})f(\vec{r})
 \end{aligned}
 $$
>注意顺序，符号含义，你可以计算任意的东西！
 
 
 - 体积分：
    $$\iiint_{V^{'}}dV^{'}=\iiint{dxdydz}=\iiint{dr d\theta d\phi} r^2sin\theta=\iiint d\rho d\phi dz\rho$$
- 面积分：
x-y平面:
$$\iint_{S}dS=\iint dxdy$$
球面：$r = R$
 $$\iint_{S}dS=\iint d\phi d\theta R^2sin\theta d\theta d\phi$$
 圆柱侧面： $\rho = R$
 $$\iint_{S}dS=\iint R d\phi dz$$
 圆柱底面： $$\iint_{S}dS=\iint \rho d\rho d\phi$$
 积分：
     $$
     \begin{aligned}
     \int_P^Qd\vec{l}\cdot\nabla [\quad]=&[\quad]|_P^Q\\
     \int_VdV\nabla[\quad]= &\oint_{\partial V}d\vec{\sigma}[\quad]\\
     \int_{\Sigma}(d\vec{\sigma}\times\nabla)[\quad]=& \oint_{\partial \Sigma}d\vec{l}[\quad]\\
     \end{aligned}
     $$
 - 泰勒展开：
   $$
    f(x) = \sum \frac{1}{n!}f^{n}(x_0)(x-x_0)^n
   $$
  > 可以直接展开，但也建议小量展开一般往几种模板上展开：$sin(x),cos(x),e^{x},ln(1+x)，\frac{1}{(1+x)^a}$这通常需要把一些部分进行换元（例如作业1.17）需要对$\frac{1}{1+x^2-2xcos\theta}$做展开，这里$x<<1$是小量，当$x\to 0$时$(x^2-2xcos\theta) \to 0$,对$(x^2-2xcos\theta)$整体先展开，展开到需要的阶数，注意由于是对$(x^2-2xcos\theta)$展开，一阶项也会包含二阶项，因此计算二阶项时不要漏了。

**库仑定律**
- 点电荷$q_1$对点电荷$q_2$的力$\vec{F}=\frac{1}{4\pi\epsilon_0}\frac{q_1q_2}{r_{12}^2}\hat{r}_{12}$  
- 点电荷$q$在$\vec{r}$处的电场强度$\vec{E}=\frac{1}{4\pi\epsilon}\frac{q}{r^2}\hat{r}$ 
- 体电荷系统，面电荷系统，线电荷系统：
    $$
	 \vec{E}(\vec{r})=\frac{1}{4{\pi}{\epsilon}_0}\iiint_{V^{'}}dV^{'}\frac{\rho_e(\vec{r}^{'})}{|\vec{r}-\vec{r}^{'}|^2}(\hat{r}-\hat{r}^{'}) 
	 $$
	 $$
	 \vec{E}(\vec{r})=\frac{1}{4{\pi}{\epsilon}_0}\iint_{S^{'}}dS^{'}\frac{\sigma_e(\vec{r}^{'})}{|\vec{r}-\vec{r}^{'}|^2}(\hat{r}-\hat{r}^{'})
	 $$
	 $$\vec{E}(\vec{r})=\frac{1}{4{\pi}    {\epsilon}_0}\int_{L^{'}}dl^{'}\frac{\lambda_e(\vec{r}^{'})}{|\vec{r}-\vec{r}^{'}|^2}(\hat{r}-\hat{r}^{'})
	 $$
> 只求空间中一个比较特殊的点（这个点和电荷分布一起具有某种特殊性时）的电场时，用这几个式子,习题1.5，1.6（由于1.6相当于求x方向电场，求AC上的电势再对x求导也行，注意因为只求AC上的电势，你取了y=0，最后的电势中不含有y了，这不代表没有y方向电场，如果要求y方向电场，你就要任取（x,y），求该店的电势，对y求导得到y方向电场。最经典的例子就是1.7，先求电势再求电场会很麻烦


**静电场的基本性质**
- 高斯定理：微分形式：$\nabla\cdot\vec{E}(\vec{r})=\rho_e(\vec{r})/\epsilon_0$ 积分形式：
$$
\oint_{\partial V}d\vec{\sigma}\cdot\vec{E}=\iiint_{V}\rho_{e}/\epsilon_0=Q_0/\epsilon_0
$$
- 静电场无旋：微分形式：$\nabla\times\vec{E}(\vec{r})=0$ 积分形式： 
$$
\oint_{\partial \Sigma}d\vec{l}\cdot\vec{E}=0
$$
- 无旋告诉我们，一定存在一个标量函数$\phi(\vec{r})$ ,$\vec{E}(\vec{r})=-\nabla\phi(\vec{r})$ 
   $$
	 \phi(\vec{r})=\frac{1}{4{\pi}{\epsilon}_0}\iiint_{V^{'}}dV^{'}\frac{\rho_e(\vec{r}^{'})}{|\vec{r}-\vec{r}^{'}|}
	 $$
	$$
	 \phi(\vec{r})=\frac{1}{4{\pi}{\epsilon}_0}\iint_{S^{'}}dS^{'}\frac{\sigma_e(\vec{r}^{'})}{|\vec{r}-\vec{r}^{'}|}
	 $$
	  
	$$\phi(\vec{r})=\frac{1}{4{\pi}{\epsilon}_0}\int_{L^{'}}dl^{'}\frac{\lambda_e(\vec{r}^{'})}{|\vec{r}-\vec{r}^{'}|}
	 $$
> 要求空间任意一点电场时，先求电势，再对电势求梯度得电场（习题1.21，1.17，1.18），体系对称（均匀分布球壳，无限长柱，无限大平板，用高斯定理（积分形式））高斯定理，高斯定理一定是先得到电场，对电场沿一条路径积分得到电势。
 
