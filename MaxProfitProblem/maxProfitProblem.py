def max_profit(n):
    best_profit = 0
    best_combo = (0, 0, 0)

    for t in range(n // 5 + 1):
        for p in range(n // 4 + 1):
            for c in range(n // 10 + 1):
                time = t*5 + p*4 + c*10
                if time > n:
                    continue

                curr_time = 0
                profit = 0

                for _ in range(t):
                    curr_time += 5
                    profit += (n - curr_time) * 1500

                for _ in range(p):
                    curr_time += 4
                    profit += (n - curr_time) * 1000

                for _ in range(c):
                    curr_time += 10
                    profit += (n - curr_time) * 2000

                if profit > best_profit:
                    best_profit = profit
                    best_combo = (t, p, c)

    return best_profit, best_combo

 # sample Test cases
test_cases = [7, 8, 13]

for n in test_cases:
    profit, (t, p, c) = max_profit(n)
    print(f"Time: {n}")
    print(f"Profit: ${profit}")
    print(f"T:{t} P:{p} C:{c}")
    print("-" * 30)