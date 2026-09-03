// Reference C++ solutions, authored as static content (no live backend —
// keeps this a 100% static site). Currently covers Week 1 of the tracker;
// more weeks can be added the same way. Each entry is keyed by the problem's
// `id` (the LeetCode URL slug, see src/data/problems.json).
import type { SolutionMap } from "../types";

export const solutions: SolutionMap = {
  "two-sum": {
    approach: [
      "Walk the array once, keeping a hash map of value -> index seen so far.",
      "For each element x, check if (target - x) is already in the map.",
      "If it is, you've found the pair; otherwise record x and keep going.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen; // value -> index
        for (int i = 0; i < (int)nums.size(); i++) {
            auto it = seen.find(target - nums[i]);
            if (it != seen.end()) return {it->second, i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
  },

  "longest-common-prefix": {
    approach: [
      "Take the first string as a candidate prefix.",
      "Compare it against every other string, shrinking the candidate on mismatch.",
      "Stop early once the candidate becomes empty.",
    ],
    complexity: { time: "O(n * m)", space: "O(1)" },
    code: `class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        if (strs.empty()) return "";
        string prefix = strs[0];
        for (int i = 1; i < (int)strs.size(); i++) {
            int j = 0;
            while (j < (int)prefix.size() && j < (int)strs[i].size() && prefix[j] == strs[i][j]) j++;
            prefix = prefix.substr(0, j);
            if (prefix.empty()) return "";
        }
        return prefix;
    }
};`,
  },

  "longest-consecutive-sequence": {
    approach: [
      "Put all numbers in a hash set for O(1) lookups.",
      "Only start counting a sequence from a number x where x-1 is NOT in the set (a true sequence start).",
      "From there, extend forward while x+1, x+2, ... exist, tracking the max length.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> s(nums.begin(), nums.end());
        int best = 0;
        for (int x : s) {
            if (s.count(x - 1)) continue; // not a sequence start
            int len = 1;
            while (s.count(x + len)) len++;
            best = max(best, len);
        }
        return best;
    }
};`,
  },

  "minimum-number-of-increments-on-subarrays-to-form-a-target-array": {
    approach: [
      "Model the problem as building a difference array from 0 to target.",
      "The minimum number of +1-on-subarray operations equals the sum of positive jumps in the difference array (diff[i] = target[i] - target[i-1]).",
      "Equivalently: sum(max(0, target[i] - target[i-1])) with target[-1] = 0.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    int minNumberOperations(vector<int>& target) {
        int ops = target[0];
        for (int i = 1; i < (int)target.size(); i++) {
            ops += max(0, target[i] - target[i - 1]);
        }
        return ops;
    }
};`,
  },

  "majority-element": {
    approach: [
      "Boyer-Moore voting: track a candidate and a running count.",
      "If count hits 0, switch candidate to the current element.",
      "Increment count when the element matches the candidate, decrement otherwise.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    int majorityElement(vector<int>& nums) {
        int candidate = 0, count = 0;
        for (int x : nums) {
            if (count == 0) candidate = x;
            count += (x == candidate) ? 1 : -1;
        }
        return candidate;
    }
};`,
  },

  "unique-number-of-occurrences": {
    approach: [
      "Count the frequency of every value with a hash map.",
      "Insert all the frequency counts into a set.",
      "If the set's size matches the map's size, every frequency was unique.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    bool uniqueOccurrences(vector<int>& arr) {
        unordered_map<int, int> freq;
        for (int x : arr) freq[x]++;
        unordered_set<int> counts;
        for (auto& [val, c] : freq) counts.insert(c);
        return counts.size() == freq.size();
    }
};`,
  },

  "minimum-area-rectangle": {
    approach: [
      "Put every point in a hash set for O(1) existence checks.",
      "For every pair of points that could be diagonal corners (x1<x2, y1<y2), check if the other two corners (x1,y2) and (x2,y1) exist.",
      "Track the minimum area among all valid rectangles found.",
    ],
    complexity: { time: "O(n^2)", space: "O(n)" },
    code: `class Solution {
public:
    int minAreaRect(vector<vector<int>>& points) {
        set<pair<int,int>> pts;
        for (auto& p : points) pts.insert({p[0], p[1]});
        int best = INT_MAX;
        for (int i = 0; i < (int)points.size(); i++) {
            for (int j = i + 1; j < (int)points.size(); j++) {
                int x1 = points[i][0], y1 = points[i][1];
                int x2 = points[j][0], y2 = points[j][1];
                if (x1 == x2 || y1 == y2) continue;
                if (pts.count({x1, y2}) && pts.count({x2, y1})) {
                    best = min(best, abs(x2 - x1) * abs(y2 - y1));
                }
            }
        }
        return best == INT_MAX ? 0 : best;
    }
};`,
  },

  "subarray-sum-equals-k": {
    approach: [
      "Track a running prefix sum and a hash map of prefixSum -> count of times seen.",
      "At each index, the number of subarrays ending here with sum k equals count[prefixSum - k].",
      "Seed the map with {0: 1} to handle subarrays starting at index 0.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> count{{0, 1}};
        int sum = 0, total = 0;
        for (int x : nums) {
            sum += x;
            auto it = count.find(sum - k);
            if (it != count.end()) total += it->second;
            count[sum]++;
        }
        return total;
    }
};`,
  },

  "group-anagrams": {
    approach: [
      "For each string, sort its characters to build a canonical key (anagrams share the same key).",
      "Group strings by that key in a hash map.",
      "Return the grouped buckets.",
    ],
    complexity: { time: "O(n * k log k)", space: "O(n * k)" },
    code: `class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> groups;
        for (auto& s : strs) {
            string key = s;
            sort(key.begin(), key.end());
            groups[key].push_back(s);
        }
        vector<vector<string>> result;
        for (auto& [key, group] : groups) result.push_back(move(group));
        return result;
    }
};`,
  },

  "rotate-array": {
    approach: [
      "Rotating right by k is equivalent to reversing the whole array, then reversing the first k and the remaining n-k elements.",
      "Normalize k with k %= n first to handle k >= n.",
      "All in-place, O(1) extra space.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    void rotate(vector<int>& nums, int k) {
        int n = nums.size();
        k %= n;
        reverse(nums.begin(), nums.end());
        reverse(nums.begin(), nums.begin() + k);
        reverse(nums.begin() + k, nums.end());
    }
};`,
  },

  "pascals-triangle": {
    approach: [
      "Build the triangle row by row.",
      "Each row starts and ends with 1; interior values are the sum of the two values above.",
    ],
    complexity: { time: "O(numRows^2)", space: "O(numRows^2)" },
    code: `class Solution {
public:
    vector<vector<int>> generate(int numRows) {
        vector<vector<int>> triangle;
        for (int i = 0; i < numRows; i++) {
            vector<int> row(i + 1, 1);
            for (int j = 1; j < i; j++) {
                row[j] = triangle[i - 1][j - 1] + triangle[i - 1][j];
            }
            triangle.push_back(row);
        }
        return triangle;
    }
};`,
  },

  "product-of-array-except-self": {
    approach: [
      "Compute a prefix-product array where result[i] = product of everything to the left of i.",
      "Then sweep right to left, multiplying in a running suffix product.",
      "No division needed, and only the output array is extra space.",
    ],
    complexity: { time: "O(n)", space: "O(1) extra (output not counted)" },
    code: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> result(n, 1);
        for (int i = 1; i < n; i++) result[i] = result[i - 1] * nums[i - 1];
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            result[i] *= suffix;
            suffix *= nums[i];
        }
        return result;
    }
};`,
  },

  "contains-duplicate": {
    approach: [
      "Insert elements into a hash set one by one.",
      "If an element is already present, a duplicate exists.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen;
        for (int x : nums) {
            if (!seen.insert(x).second) return true;
        }
        return false;
    }
};`,
  },

  "plus-one": {
    approach: [
      "Walk the digits from the right, adding 1 with carry propagation.",
      "If a digit is less than 9, incrementing it stops the carry immediately.",
      "If every digit was 9 (all carried to 0), prepend a leading 1.",
    ],
    complexity: { time: "O(n)", space: "O(1) extra" },
    code: `class Solution {
public:
    vector<int> plusOne(vector<int>& digits) {
        for (int i = digits.size() - 1; i >= 0; i--) {
            if (digits[i] < 9) {
                digits[i]++;
                return digits;
            }
            digits[i] = 0;
        }
        digits.insert(digits.begin(), 1);
        return digits;
    }
};`,
  },

  "running-sum-of-1d-array": {
    approach: ["Accumulate a running total in place as you scan left to right."],
    complexity: { time: "O(n)", space: "O(1) extra" },
    code: `class Solution {
public:
    vector<int> runningSum(vector<int>& nums) {
        for (int i = 1; i < (int)nums.size(); i++) nums[i] += nums[i - 1];
        return nums;
    }
};`,
  },

  "max-consecutive-ones": {
    approach: [
      "Scan once, keeping a running streak counter that resets on a 0.",
      "Track the best streak seen so far.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    int findMaxConsecutiveOnes(vector<int>& nums) {
        int best = 0, streak = 0;
        for (int x : nums) {
            streak = x == 1 ? streak + 1 : 0;
            best = max(best, streak);
        }
        return best;
    }
};`,
  },

  "merge-sorted-array": {
    approach: [
      "Merge from the back: nums1 has trailing empty space, so filling it from the end avoids overwriting unread elements.",
      "Compare the tails of nums1[0..m) and nums2[0..n), placing the larger at the current back pointer.",
    ],
    complexity: { time: "O(m + n)", space: "O(1)" },
    code: `class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
            if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
            else nums1[k--] = nums2[j--];
        }
    }
};`,
  },

  "merge-strings-alternately": {
    approach: [
      "Walk both strings with two pointers, appending one character from each alternately.",
      "Once one string runs out, append the remainder of the other.",
    ],
    complexity: { time: "O(n + m)", space: "O(n + m) for output" },
    code: `class Solution {
public:
    string mergeAlternately(string word1, string word2) {
        string result;
        int i = 0, j = 0;
        while (i < (int)word1.size() || j < (int)word2.size()) {
            if (i < (int)word1.size()) result += word1[i++];
            if (j < (int)word2.size()) result += word2[j++];
        }
        return result;
    }
};`,
  },

  "trapping-rain-water": {
    approach: [
      "Use two pointers from both ends with running leftMax/rightMax.",
      "Move the pointer on the side with the smaller max inward — water at that position is bounded by that side's max.",
      "Add (max - height[pointer]) to the total at each step.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    int trap(vector<int>& height) {
        int l = 0, r = height.size() - 1;
        int leftMax = 0, rightMax = 0, water = 0;
        while (l < r) {
            if (height[l] < height[r]) {
                leftMax = max(leftMax, height[l]);
                water += leftMax - height[l];
                l++;
            } else {
                rightMax = max(rightMax, height[r]);
                water += rightMax - height[r];
                r--;
            }
        }
        return water;
    }
};`,
  },

  "3sum": {
    approach: [
      "Sort the array, then fix one element and two-pointer the rest for pairs summing to -fixed.",
      "Skip duplicate values at every level (outer and both pointers) to avoid duplicate triplets.",
    ],
    complexity: { time: "O(n^2)", space: "O(1) extra (excluding output)" },
    code: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> result;
        int n = nums.size();
        for (int i = 0; i < n - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            if (nums[i] > 0) break;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else {
                    result.push_back({nums[i], nums[l], nums[r]});
                    l++; r--;
                    while (l < r && nums[l] == nums[l - 1]) l++;
                    while (l < r && nums[r] == nums[r + 1]) r--;
                }
            }
        }
        return result;
    }
};`,
  },

  "container-with-most-water": {
    approach: [
      "Two pointers starting at both ends; area is limited by the shorter line.",
      "Move the pointer at the shorter line inward — moving the taller one can only shrink or keep the width without helping the height bound.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    int maxArea(vector<int>& height) {
        int l = 0, r = height.size() - 1, best = 0;
        while (l < r) {
            int area = min(height[l], height[r]) * (r - l);
            best = max(best, area);
            if (height[l] < height[r]) l++; else r--;
        }
        return best;
    }
};`,
  },

  "remove-duplicates-from-sorted-array": {
    approach: [
      "Since the array is sorted, duplicates are adjacent.",
      "Keep a slow pointer for the next unique-write position; advance a fast pointer and copy whenever a new value is found.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        if (nums.empty()) return 0;
        int slow = 1;
        for (int fast = 1; fast < (int)nums.size(); fast++) {
            if (nums[fast] != nums[slow - 1]) {
                nums[slow++] = nums[fast];
            }
        }
        return slow;
    }
};`,
  },

  "next-permutation": {
    approach: [
      "Scan from the right to find the first index i where nums[i] < nums[i+1] (the pivot).",
      "If found, scan from the right again to find the first element greater than nums[i], swap them.",
      "Reverse the suffix after i to get the smallest next arrangement (if no pivot exists, the array is fully descending — just reverse it).",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    void nextPermutation(vector<int>& nums) {
        int n = nums.size();
        int i = n - 2;
        while (i >= 0 && nums[i] >= nums[i + 1]) i--;
        if (i >= 0) {
            int j = n - 1;
            while (nums[j] <= nums[i]) j--;
            swap(nums[i], nums[j]);
        }
        reverse(nums.begin() + i + 1, nums.end());
    }
};`,
  },

  "remove-element": {
    approach: [
      "Two pointers: a write pointer that only advances when the current element should be kept.",
      "Overwrite in place; the first `write` elements form the answer.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    int removeElement(vector<int>& nums, int val) {
        int write = 0;
        for (int x : nums) {
            if (x != val) nums[write++] = x;
        }
        return write;
    }
};`,
  },

  "valid-parentheses": {
    approach: [
      "Push opening brackets onto a stack.",
      "On a closing bracket, check the stack top matches the corresponding opener and pop it.",
      "String is valid iff the stack is empty at the end.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        unordered_map<char, char> pairs{{')', '('}, {']', '['}, {'}', '{'}};
        for (char c : s) {
            if (c == '(' || c == '[' || c == '{') {
                st.push(c);
            } else {
                if (st.empty() || st.top() != pairs[c]) return false;
                st.pop();
            }
        }
        return st.empty();
    }
};`,
  },

  "longest-substring-without-repeating-characters": {
    approach: [
      "Sliding window with a hash map of char -> last seen index.",
      "When a repeated character is found inside the current window, jump the window start past its previous occurrence.",
      "Track the max window length throughout.",
    ],
    complexity: { time: "O(n)", space: "O(min(n, charset))" },
    code: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> lastSeen;
        int best = 0, start = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            if (lastSeen.count(s[i]) && lastSeen[s[i]] >= start) {
                start = lastSeen[s[i]] + 1;
            }
            lastSeen[s[i]] = i;
            best = max(best, i - start + 1);
        }
        return best;
    }
};`,
  },

  "longest-repeating-character-replacement": {
    approach: [
      "Sliding window over the string, tracking counts of each letter in the window and the count of the most frequent letter (maxFreq).",
      "A window of length (r-l+1) is valid if (length - maxFreq) <= k (i.e. we can replace the minority characters).",
      "If invalid, shrink from the left; maxFreq doesn't need to shrink correctly since the window size is monotonic non-decreasing for the answer.",
    ],
    complexity: { time: "O(n)", space: "O(26)" },
    code: `class Solution {
public:
    int characterReplacement(string s, int k) {
        vector<int> count(26, 0);
        int left = 0, maxFreq = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            maxFreq = max(maxFreq, ++count[s[right] - 'A']);
            while ((right - left + 1) - maxFreq > k) {
                count[s[left] - 'A']--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  "sliding-window-maximum": {
    approach: [
      "Maintain a deque of indices whose values are in decreasing order.",
      "Pop from the back while the new value is bigger (they can never be the max while the new one is in range).",
      "Pop from the front when the front index falls outside the window; the front is always the current max.",
    ],
    complexity: { time: "O(n)", space: "O(k)" },
    code: `class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> dq; // stores indices, values decreasing
        vector<int> result;
        for (int i = 0; i < (int)nums.size(); i++) {
            while (!dq.empty() && nums[dq.back()] < nums[i]) dq.pop_back();
            dq.push_back(i);
            if (dq.front() <= i - k) dq.pop_front();
            if (i >= k - 1) result.push_back(nums[dq.front()]);
        }
        return result;
    }
};`,
  },

  "max-consecutive-ones-iii": {
    approach: [
      "Sliding window that allows at most k zeros inside.",
      "Expand right always; when zero-count exceeds k, shrink from the left until it's back within budget.",
      "Track the max window length.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class Solution {
public:
    int longestOnes(vector<int>& nums, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > k) {
                if (nums[left] == 0) zeros--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  "permutation-in-string": {
    approach: [
      "Build a 26-length frequency count for s1, and a sliding window of the same size over s2 with its own count.",
      "Slide the window one character at a time, adding the new char and removing the one that fell off.",
      "If the two count arrays ever match, a permutation of s1 exists in s2.",
    ],
    complexity: { time: "O(n)", space: "O(26)" },
    code: `class Solution {
public:
    bool checkInclusion(string s1, string s2) {
        if (s1.size() > s2.size()) return false;
        vector<int> need(26, 0), window(26, 0);
        for (char c : s1) need[c - 'a']++;
        int k = s1.size();
        for (int i = 0; i < (int)s2.size(); i++) {
            window[s2[i] - 'a']++;
            if (i >= k) window[s2[i - k] - 'a']--;
            if (i >= k - 1 && window == need) return true;
        }
        return false;
    }
};`,
  },

  "fruit-into-baskets": {
    approach: [
      "This is 'longest subarray with at most 2 distinct values' in disguise.",
      "Sliding window with a hash map of value -> last index; when a third distinct type appears, shrink the window from just after the earliest-seen removed type.",
    ],
    complexity: { time: "O(n)", space: "O(1) (at most 3 keys)" },
    code: `class Solution {
public:
    int totalFruit(vector<int>& fruits) {
        unordered_map<int, int> lastIndex;
        int left = 0, best = 0;
        for (int right = 0; right < (int)fruits.size(); right++) {
            lastIndex[fruits[right]] = right;
            if (lastIndex.size() > 2) {
                int minIdx = INT_MAX;
                int typeToRemove = -1;
                for (auto& [type, idx] : lastIndex) {
                    if (idx < minIdx) { minIdx = idx; typeToRemove = type; }
                }
                lastIndex.erase(typeToRemove);
                left = minIdx + 1;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  "frequency-of-the-most-frequent-element": {
    approach: [
      "Sort the array; use a sliding window and track the window sum.",
      "For a window [l, r], the total increments needed to make everything equal nums[r] is nums[r]*(r-l+1) - sum.",
      "If that cost exceeds k, shrink from the left; the answer is the max window size seen.",
    ],
    complexity: { time: "O(n log n)", space: "O(1)" },
    code: `class Solution {
public:
    int maxFrequency(vector<int>& nums, int k) {
        sort(nums.begin(), nums.end());
        long long sum = 0;
        int left = 0, best = 1;
        for (int right = 0; right < (int)nums.size(); right++) {
            sum += nums[right];
            while ((long long)nums[right] * (right - left + 1) - sum > k) {
                sum -= nums[left++];
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  "median-of-two-sorted-arrays": {
    approach: [
      "Binary search on the partition point of the smaller array so that combined left/right halves split all elements evenly.",
      "For a candidate partition, check maxLeft <= minRight on both sides; adjust the binary search bounds otherwise.",
      "Once balanced, the median comes from the boundary elements (average of two if total length is even).",
    ],
    complexity: { time: "O(log(min(m, n)))", space: "O(1)" },
    code: `class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size() > nums2.size()) return findMedianSortedArrays(nums2, nums1);
        int m = nums1.size(), n = nums2.size();
        int lo = 0, hi = m, half = (m + n + 1) / 2;
        while (lo <= hi) {
            int i = (lo + hi) / 2;
            int j = half - i;
            int leftA = (i == 0) ? INT_MIN : nums1[i - 1];
            int rightA = (i == m) ? INT_MAX : nums1[i];
            int leftB = (j == 0) ? INT_MIN : nums2[j - 1];
            int rightB = (j == n) ? INT_MAX : nums2[j];
            if (leftA <= rightB && leftB <= rightA) {
                if ((m + n) % 2 == 1) return max(leftA, leftB);
                return (max(leftA, leftB) + min(rightA, rightB)) / 2.0;
            } else if (leftA > rightB) {
                hi = i - 1;
            } else {
                lo = i + 1;
            }
        }
        return 0.0;
    }
};`,
  },

  "split-array-largest-sum": {
    approach: [
      "Binary search on the answer: the minimum possible 'largest subarray sum' lies between max(nums) and sum(nums).",
      "For a candidate max-sum value, greedily count how many subarrays are needed to keep every chunk under it.",
      "If that count exceeds k, the candidate is too small — raise the lower bound; otherwise it's feasible — try smaller.",
    ],
    complexity: { time: "O(n log(sum))", space: "O(1)" },
    code: `class Solution {
public:
    int splitArray(vector<int>& nums, int k) {
        long long lo = 0, hi = 0;
        for (int x : nums) { lo = max(lo, (long long)x); hi += x; }
        while (lo < hi) {
            long long mid = lo + (hi - lo) / 2;
            int pieces = 1;
            long long cur = 0;
            for (int x : nums) {
                if (cur + x > mid) { pieces++; cur = x; }
                else cur += x;
            }
            if (pieces > k) lo = mid + 1; else hi = mid;
        }
        return (int)lo;
    }
};`,
  },

  "largest-rectangle-in-histogram": {
    approach: [
      "Maintain a monotonic increasing stack of bar indices.",
      "When a shorter bar is found, pop taller bars off the stack, computing the rectangle they'd form using the current index as the right boundary and the new stack top as the left boundary.",
      "Push a sentinel 0-height bar at the end to flush the stack.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        stack<int> st; // increasing heights
        int best = 0;
        for (int i = 0; i <= (int)heights.size(); i++) {
            int h = (i == (int)heights.size()) ? 0 : heights[i];
            while (!st.empty() && heights[st.top()] >= h) {
                int height = heights[st.top()];
                st.pop();
                int width = st.empty() ? i : i - st.top() - 1;
                best = max(best, height * width);
            }
            st.push(i);
        }
        return best;
    }
};`,
  },

  "decode-string": {
    approach: [
      "Use two stacks (or one stack of pairs): one for repeat counts, one for the string built so far.",
      "On a digit, accumulate the number. On '[', push the current string+count and reset. On ']', pop and repeat the inner string, appending to the popped outer string.",
      "On a normal character, append to the current string.",
    ],
    complexity: { time: "O(n * maxK)", space: "O(n)" },
    code: `class Solution {
public:
    string decodeString(string s) {
        stack<string> strStack;
        stack<int> countStack;
        string current;
        int num = 0;
        for (char c : s) {
            if (isdigit(c)) {
                num = num * 10 + (c - '0');
            } else if (c == '[') {
                countStack.push(num);
                strStack.push(current);
                num = 0;
                current.clear();
            } else if (c == ']') {
                int k = countStack.top(); countStack.pop();
                string prev = strStack.top(); strStack.pop();
                string repeated;
                for (int i = 0; i < k; i++) repeated += current;
                current = prev + repeated;
            } else {
                current += c;
            }
        }
        return current;
    }
};`,
  },

  "odd-even-jump": {
    approach: [
      "For each index, precompute where an 'odd jump' (to the smallest value >= current, breaking ties by smallest index) and 'even jump' (to the largest value <= current) land, using a monotonic stack over indices sorted by value.",
      "DP from the end: canReachOdd[i]/canReachEven[i] tell if you can eventually reach the last index starting an odd/even jump from i.",
      "An index i is a valid start if canReachOdd[i] is true (the first jump must be odd).",
    ],
    complexity: { time: "O(n log n)", space: "O(n)" },
    code: `class Solution {
public:
    int oddEvenJumps(vector<int>& arr) {
        int n = arr.size();
        vector<int> oddNext(n, 0), evenNext(n, 0);

        auto buildNext = [&](bool ascending, vector<int>& next) {
            vector<int> indices(n);
            iota(indices.begin(), indices.end(), 0);
            sort(indices.begin(), indices.end(), [&](int a, int b) {
                if (arr[a] != arr[b]) return ascending ? arr[a] < arr[b] : arr[a] > arr[b];
                return a < b;
            });
            stack<int> st;
            for (int i : indices) {
                while (!st.empty() && st.top() < i) st.pop();
                next[i] = st.empty() ? -1 : st.top();
                st.push(i);
            }
        };

        buildNext(true, oddNext);
        buildNext(false, evenNext);

        vector<char> canOdd(n, false), canEven(n, false);
        canOdd[n - 1] = canEven[n - 1] = true;
        int result = 1;
        for (int i = n - 2; i >= 0; i--) {
            if (oddNext[i] != -1) canOdd[i] = canEven[oddNext[i]];
            if (evenNext[i] != -1) canEven[i] = canOdd[evenNext[i]];
            if (canOdd[i]) result++;
        }
        return result;
    }
};`,
  },

  "basic-calculator": {
    approach: [
      "Single left-to-right scan with a running result, a running sign, and a stack to save (result, sign) when entering parentheses.",
      "Digits accumulate into the current number; '+'/'-' apply the pending number with the current sign then update the sign.",
      "'(' pushes state and resets; ')' pops and combines, folding the parenthesized result back in with the sign that preceded it.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    int calculate(string s) {
        stack<int> st;
        int result = 0, sign = 1, num = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            char c = s[i];
            if (isdigit(c)) {
                num = num * 10 + (c - '0');
            } else if (c == '+') {
                result += sign * num; num = 0; sign = 1;
            } else if (c == '-') {
                result += sign * num; num = 0; sign = -1;
            } else if (c == '(') {
                st.push(result);
                st.push(sign);
                result = 0; sign = 1;
            } else if (c == ')') {
                result += sign * num; num = 0;
                result *= st.top(); st.pop(); // sign before '('
                result += st.top(); st.pop(); // result before '('
            }
        }
        return result + sign * num;
    }
};`,
  },

  "daily-temperatures": {
    approach: [
      "Monotonic decreasing stack of indices (by temperature).",
      "When the current temperature is higher than the stack top's, pop it and record the day distance as the answer for that index.",
      "Push the current index; unresolved indices at the end keep their default 0.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = temperatures.size();
        vector<int> answer(n, 0);
        stack<int> st; // indices, decreasing temperature
        for (int i = 0; i < n; i++) {
            while (!st.empty() && temperatures[st.top()] < temperatures[i]) {
                int idx = st.top(); st.pop();
                answer[idx] = i - idx;
            }
            st.push(i);
        }
        return answer;
    }
};`,
  },

  "remove-k-digits": {
    approach: [
      "Greedy monotonic stack: while the stack top is bigger than the incoming digit and we still have removals left (k > 0), pop it — removing a bigger digit before a smaller one always helps.",
      "Push the digit, then after the scan remove any remaining k from the end (if the number was non-decreasing).",
      "Strip leading zeros and handle the empty-result case.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class Solution {
public:
    string removeKdigits(string num, int k) {
        string st; // acts as a stack via push_back/pop_back
        for (char c : num) {
            while (!st.empty() && k > 0 && st.back() > c) {
                st.pop_back();
                k--;
            }
            st.push_back(c);
        }
        while (k-- > 0) st.pop_back();
        int start = 0;
        while (start < (int)st.size() - 1 && st[start] == '0') start++;
        string result = st.substr(start);
        return result.empty() ? "0" : result;
    }
};`,
  },
};
