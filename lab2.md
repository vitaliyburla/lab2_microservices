### Група: ІТ-91

### Боринець Олександра Ігорівна

### Бурла Віталій Ігорович

### Ткаченко Віктор Віталійович

### Хільчук Олена Валеріївна

# Лабораторна робота №2.

### Тема: Синхронний зв'язок між сервісами. Забезпечення відмовостійкості

### Завдання:

1. Розширити додаток, додати синхронну комунікацію між сервісами
2. Підвищити стабільність системи, налаштувати _retry/timeout_
3. Підвищити стабільність системи, налаштувати _circuit breaker_

### 1. Розширити додаток

Необхідно ускладнити логіку вашого додатку. Додати один або кілька сервісів, додати синхронну взаємодію між будь-якими з сервісів.

### 1.1 Створення тестового середовища. Емуляція нездорової _Pod_

> Цю частину не потрібно робити в рамках вашого додатку, але рекомендую спробувати розгорнути демонстраційний додаток,
> та перевірити як застосування retry/timeout/circuit breaker може допомогти підвищити стабільність системи

В директорії `services` містяться наступні сервіси:  
`service1` - має одну точку входу `/api/service1` - працює як і раніше  
`service2` - має дві точки входу  
 `/api/service2`. В цьому сервісі буде відбуватися емуляція нездорової _Pod_. Частина запитів буде проходити як і раніше, частина матиме затримку 10 секунд.  
 `/api/untested-request` - "ламає" _Pod_ після чого `/api/service2` матиме затримку 10 секунд  
`root-service` - сервіс, який робить запити на 2 попередні сервіси, та повертає результат

Для того, щоб зібрати контейнери для всіх необхідних сервісів можна виконати:

```shell
sh lab2_istio/docker.sh
```

Тепер розгорнемо сервіси в кластері _k8s_. В директорії `k8s_v1` міститься перша версія конфігурацій _k8s_

```shell
kubectl apply -f k8s_v1
```

```
kubectl get pods

NAME                                   READY   STATUS    RESTARTS   AGE
root-deployment-7fd6544465-tmwzj       1/1     Running   0          5s
service1-deployment-5d47768c54-57npg   1/1     Running   0          5s
service2-deployment-67c46c7878-k7zcv   1/1     Running   0          5s
service2-deployment-67c46c7878-lvqsr   1/1     Running   0          5s
service2-deployment-67c46c7878-wbnqk   1/1     Running   0          5s
```

Перевірити роботу додатку можна запустивши скрипт з директорії `test`, який робить 100 запитів на `/api/root-service` та виводить середній час запитів та кількість відмов

```shell
go run main.go
```

Зараз всі сервіси запущені, і працюють в нормальному режимі, тому всі запити проходять дуже швидко

```
average duration: 0.05 seconds
0 from 100 requests failed
```

Для емуляції нездорової _Pod_ потрібно зробити запит на `/api/service2/untested-request`

Тепер тест на 100 запитів проходить значно довше і середній час запиту більше 2-х секунд:

```
average duration: 2.76 seconds
0 from 100 requests failed

average duration: 2.15 seconds
0 from 100 requests failed

average duration: 2.24 seconds
0 from 100 requests failed
```

### 2. Налаштувати _retry/timeout_

Є два способи реалізувати _retry/timeout_:

1. **Програмно**. Реалізація функціоналу розробниками, як частина сервісів, самостійно або за допомогою бібліотек чи фреймворків.
   Якщо мова програмування на якій розробляються сервіси має хороші реалізації даного функціоналу, можете обирати цей підхід.

2. **Інфраструктурно**. За допомогою технологій [service mesh](https://habr.com/ru/company/flant/blog/327536/), які дозволяють повністю контролювати комунікацію між вашими сервісами.
   При використанні даної технології в кожен _Pod_, поряд з контейнером додатку встановлюється _side car_, додатковий контейнер, що контролює весь трафік даного сервісу.
   В лабораторний буде розглянуто один із найбільш популярних і стабільних реалізацій - _Istio_. У своїх проектах, ви також можете використовувати інші реалізації, наприклад _Linkerd_.

### 2.1 Налаштування _Istio_

> _Istio_ хоч і спрощує управління системою, він вимагає багато ресурсів, тому перед використанням на проді, зважте чи ваша система потребує цього рішення.
> При роботі з _minikube_ рекомендовано зарезервувати для віртуальної машини, на якій запущено _k8s_ _5GB_ пам'яті
> (перевіряв на _4GB_, теж працювало, але якщо дозволяють ресурси, зарезурвуйте більше)

1. Спершу [встановимо клієнт _istioctl_](https://istio.io/latest/docs/setup/getting-started/#download) ([для Windows](https://gist.github.com/VidyasagarMSC/2dcb760297f97220fb5e24621c606d76))

```shell
curl -L https://istio.io/downloadIstio | sh -

export PATH=$PWD/istio-1.9.0/bin:$PATH
```

2. Та [встановимо _istio_ в кластер _k8s_](https://istio.io/latest/docs/setup/getting-started/#install)

```shell
istioctl install --set profile=demo -y
```

3. Перед встановленням _Istio_ у власну інфраструктуру, рекомендую спробувати демонстраційні додатки, можна використати приклад з [документації](https://istio.io/latest/docs/setup/getting-started/#bookinfo)
   Або приклади, що наведені в даній роботі

Якщо виконати команду:

```
kubectl label namespace default istio-injection=enabled
```

Всі поди, що будуть створені після цього автоматично міститимуть _Istio_ _side car_.
Якщо в кластері містяться _Pod_, які запущені до інтеграції _Istio_, необхідно виконати команду (для кожного _Deployment_):

```
istioctl kube-inject -f k8s_v1/service1.yaml | kubectl apply -f -
```

Тепер у виводі `kubectl get pods` бачимо, що в кожному _Pod_ тепер по 2 контейнери: додаток та _side car_ _Istio_

```
kubectl get pods

NAME                                   READY   STATUS    RESTARTS   AGE
root-deployment-b574bd955-q54tl        2/2     Running   0          26s
service1-deployment-768df995b6-snc5z   2/2     Running   0          42s
service2-deployment-7bff9cf558-g4x2d   2/2     Running   0          25s
service2-deployment-7bff9cf558-vgjzv   2/2     Running   0          39s
service2-deployment-7bff9cf558-xvnxd   2/2     Running   0          32s
```

### 2.2 retry/timeout

Для управління трафіком _Istio_ використовує додаткову сутність [_VirtualService_](https://istio.io/latest/docs/reference/config/networking/virtual-service/)
**VirtualService** це додатковий проксі який стоїть перед сервісом на який робиться запит. В ньому визначається конфігурації, для перенаправлення трафіку.

Це простий _VirtualService_, який нічого не робитиме.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: service2-virtual
spec:
  hosts:
    - service2-service # адреса на яку звертається клієнт
  http:
    - route:
        - destination:
            host: service2-service # адреса на яку перенаправляється клієнт
```

Потрібно звернути увагу на поле `hosts` - адреса на яку звертається клієнт, та `destination.host` - адреса, куди буде перенаправлено трафік
В нашому випадку ці поля однакові, так як при надсиланні запиту на сервіс `service2-service` ми маємо направити трафік на той самий сервіс `service2-service`, але після того, як _Istio_ обробить запит

Тепер опишемо правила, _timeout_ та _retry_

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: service2-virtual
spec:
  hosts:
    - service2-service
  http:
    - route:
        - destination:
            host: service2-service
      timeout: 5s
      retries:
        attempts: 3
        retryOn: 5xx
        perTryTimeout: 5s
```

Налаштування _timeout_ дуже прості, просто поле в якому вказуємо максимальний час очікування відповіді, після якого запит обривається і повертається помилка _request timeout_.  
[Налаштування retry](https://istio.io/latest/docs/reference/config/networking/virtual-service/#HTTPRetry):  
`attempts`, (обов'язкове поле) яке визначає кількість запитів, яку потрібно зробити.  
`perTryTimeout` таймаут на кожен ретрай, за замовчуванням таке ж значення як і `timeout`  
`retryOn` - вказує на які типи помилок робити повторний запит, в даному випадку, всі помилки з будь-яким 500-м кодом, детальніше [тут](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter#x-envoy-retry-on)

> Зверніть увагу, що при такому налаштуванні _retry_ та _timeout_ працюватимуть лише, якщо запитити робитимуться в середині кластера.
> Запит на `api/service2` напряму працюватиме як і раніше

Застосуємо налаштування та перевіримо, що змінилось

```shell
kubectl apply -f k8s_v2
```

> Після застосування нових налаштувань потрібно знову "зламати" одну з _Pod_

```
average duration: 1.74 seconds
0 from 100 requests failed

average duration: 1.74 seconds
0 from 100 requests failed

average duration: 1.78 seconds
0 from 100 requests failed
```

Як бачимо середній час запиту зменшився, тому що після 5 секунд очікування запит завершується з помилкою через `timeout: 5s`,
після цього виконується повторний запит на іншу _Pod_, яка працює швидко.

### 3. Налаштування _circuit breaker_

Наступним кроком для покращення доступності та роботи додатку буде перестати надсилати запити на _Pod_, яка працює не стабільно.
Для цього застосуємо патерн _circuit breaker_.

Для управління трафіком _Istio_ використовує ще одну додаткову сутність [_DestinationRule_](https://istio.io/latest/docs/reference/config/networking/destination-rule/)  
**DestinationRule** визначає правила для трафіку після того як перенаправлення відбулось. В ньому описуються налаштування для балансування навантаження, обмеження кількості з'єднань та визначення нездорових _Pod_.

Ось приклад простого налаштування `circuit breaker` в DestinationRule

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: service2-destination
spec:
  host: service2-service
  trafficPolicy:
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 80
```

Налаштування можна прочитати наступним чином.
Якщо протягом 10 секунд (interval) відбулося 5 помилок з кодом `5xx` (consecutive5xxErrors), _Pod_ буде виключено з балансера навантаження, на 30 секунд (baseEjectionTime)
за умови, що як мінімум 20% запущених _Pod_ (100% - maxEjectionPercent) залишиться працювати

> Налаштування підібрані таким чином, щод було легко перевірити результат на демо, це не рекомендований варіант.

Застосуємо налаштування та перевіримо, як це вплинуло на систему

```shell
kubectl apply -f k8s_v3
```

Перших 100 запитів мають середній час очікування, як і раніше, тому що для перевірки `circuit breaker` необхідно 10 секунд,
тоді як наступні проходять майже миттєво, так як після виключення нездорової _Pod_ всі запити проходять за кілька мілісекунд

```
average duration: 1.76 seconds
0 from 100 requests failed

average duration: 0.11 seconds
0 from 100 requests failed

average duration: 0.10 seconds
0 from 100 requests failed
```
