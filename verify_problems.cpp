#include <iostream>
#include <vector>
#include <string>
#include <set>
#include <algorithm>
#include <cmath>
#include <sstream>

using namespace std;

// Evaluate expression using recursive descent parser
class ExpressionEvaluator {
private:
    string expr;
    size_t pos;

    double parseNumber() {
        double result = 0;
        while (pos < expr.length() && isdigit(expr[pos])) {
            result = result * 10 + (expr[pos] - '0');
            pos++;
        }
        return result;
    }

    double parseFactor() {
        if (expr[pos] == '(') {
            pos++; // skip '('
            double result = parseExpression();
            pos++; // skip ')'
            return result;
        }

        // Handle unary minus
        if (expr[pos] == '-') {
            pos++;
            return -parseFactor();
        }

        return parseNumber();
    }

    double parseTerm() {
        double result = parseFactor();

        while (pos < expr.length() && (expr[pos] == '*' || expr[pos] == '/')) {
            char op = expr[pos++];
            double right = parseFactor();
            if (op == '*') {
                result *= right;
            } else {
                if (abs(right) < 1e-9) return NAN; // Division by zero
                result /= right;
            }
        }

        return result;
    }

    double parseExpression() {
        double result = parseTerm();

        while (pos < expr.length() && (expr[pos] == '+' || expr[pos] == '-')) {
            char op = expr[pos++];
            double right = parseTerm();
            if (op == '+') {
                result += right;
            } else {
                result -= right;
            }
        }

        return result;
    }

public:
    bool evaluate(const string& expression) {
        expr = expression;
        pos = 0;

        try {
            double result = parseExpression();
            return abs(result - 10.0) < 0.0001;
        } catch (...) {
            return false;
        }
    }
};

// Generate all permutations with duplicate handling
void getAllPermutations(vector<int> arr, vector<vector<int>>& result, vector<int>& current, vector<bool>& used) {
    if (current.size() == arr.size()) {
        result.push_back(current);
        return;
    }

    set<int> usedInLevel;
    for (size_t i = 0; i < arr.size(); i++) {
        if (used[i] || usedInLevel.count(arr[i])) continue;

        usedInLevel.insert(arr[i]);
        used[i] = true;
        current.push_back(arr[i]);

        getAllPermutations(arr, result, current, used);

        current.pop_back();
        used[i] = false;
    }
}

// Generate all expressions for given numbers (no rearrangement, NO SIGNS)
void generateExpressions(const vector<int>& nums, vector<string>& expressions) {
    vector<char> operators = {'+', '-', '*', '/'};

    // All numbers are positive (no signs)
    string n0 = to_string(nums[0]);
    string n1 = to_string(nums[1]);
    string n2 = to_string(nums[2]);
    string n3 = to_string(nums[3]);

    // Generate all operator combinations (3 operators)
    for (char op1 : operators) {
        for (char op2 : operators) {
            for (char op3 : operators) {
                // No parentheses
                expressions.push_back(n0 + op1 + n1 + op2 + n2 + op3 + n3);

                // Single parentheses (3 patterns)
                expressions.push_back("(" + n0 + op1 + n1 + ")" + op2 + n2 + op3 + n3);
                expressions.push_back(n0 + op1 + "(" + n1 + op2 + n2 + ")" + op3 + n3);
                expressions.push_back(n0 + op1 + n1 + op2 + "(" + n2 + op3 + n3 + ")");

                // Double parentheses (6 patterns)
                expressions.push_back("((" + n0 + op1 + n1 + ")" + op2 + n2 + ")" + op3 + n3);
                expressions.push_back("(" + n0 + op1 + "(" + n1 + op2 + n2 + "))" + op3 + n3);
                expressions.push_back(n0 + op1 + "((" + n1 + op2 + n2 + ")" + op3 + n3 + ")");
                expressions.push_back(n0 + op1 + "(" + n1 + op2 + "(" + n2 + op3 + n3 + "))");
                expressions.push_back("(" + n0 + op1 + n1 + ")" + op2 + "(" + n2 + op3 + n3 + ")");
                expressions.push_back(n0 + op1 + "(" + n1 + op2 + n2 + op3 + n3 + ")");

                // Triple parentheses (2 patterns)
                expressions.push_back("(((" + n0 + op1 + n1 + ")" + op2 + n2 + ")" + op3 + n3 + ")");
                expressions.push_back("(" + n0 + op1 + "((" + n1 + op2 + n2 + ")" + op3 + n3 + "))");
            }
        }
    }
}

// Check if problem is solvable
bool isSolvable(const string& problem) {
    vector<int> nums;
    for (char c : problem) {
        nums.push_back(c - '0');
    }

    vector<string> expressions;
    generateExpressions(nums, expressions);

    ExpressionEvaluator evaluator;
    for (const string& expr : expressions) {
        if (evaluator.evaluate(expr)) {
            return true;
        }
    }

    return false;
}

int main() {
    set<string> solvable;
    int totalChecked = 0;

    cout << "Starting complete verification (0000-9999 WITHOUT reordering, WITHOUT signs)..." << endl;

    for (int i = 0; i <= 9999; i++) {
        // Convert to 4-digit string
        char baseStr[5];
        sprintf(baseStr, "%04d", i);
        string numStr(baseStr);

        totalChecked++;

        // Check if solvable in ORIGINAL ORDER ONLY (no permutations)
        if (isSolvable(numStr)) {
            solvable.insert(numStr);
        }

        // Progress update every 100 combinations
        if (i % 100 == 0 || i == 9999) {
            int progress = (i * 100) / 9999;
            cout << "\rProgress: " << i + 1 << " / 10000 (" << progress << "%) | "
                 << "Solvable: " << solvable.size() << flush;
        }
    }

    cout << endl << endl;
    cout << "Verification complete!" << endl;
    cout << "Total patterns checked: " << totalChecked << endl;
    cout << "Solvable patterns found: " << solvable.size() << endl;
    cout << endl;

    // Convert to sorted vector
    vector<string> solvableArray(solvable.begin(), solvable.end());
    sort(solvableArray.begin(), solvableArray.end());

    // Output JavaScript array format
    cout << "// JavaScript array format:" << endl;
    cout << "const PROBLEMS = [" << endl;

    for (size_t i = 0; i < solvableArray.size(); i++) {
        if (i % 10 == 0) {
            if (i > 0) cout << "," << endl;
            cout << "    ";
        } else {
            cout << ", ";
        }
        cout << "\"" << solvableArray[i] << "\"";
    }

    cout << endl << "];" << endl;

    return 0;
}
